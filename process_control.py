"""Own subprocess trees and bound both execution and timeout cleanup."""
import os
import signal
import subprocess


class WindowsJob:
    def __init__(self, process):
        import ctypes
        from ctypes import wintypes

        class BasicLimits(ctypes.Structure):
            _fields_ = [('process_time', ctypes.c_longlong), ('job_time', ctypes.c_longlong),
                        ('flags', wintypes.DWORD), ('minimum_working_set', ctypes.c_size_t),
                        ('maximum_working_set', ctypes.c_size_t), ('active_process_limit', wintypes.DWORD),
                        ('affinity', ctypes.c_size_t), ('priority', wintypes.DWORD),
                        ('scheduling', wintypes.DWORD)]

        class IoCounters(ctypes.Structure):
            _fields_ = [(name, ctypes.c_ulonglong) for name in
                        ('read_ops', 'write_ops', 'other_ops', 'read_bytes', 'write_bytes', 'other_bytes')]

        class ExtendedLimits(ctypes.Structure):
            _fields_ = [('basic', BasicLimits), ('io', IoCounters),
                        ('process_memory', ctypes.c_size_t), ('job_memory', ctypes.c_size_t),
                        ('peak_process_memory', ctypes.c_size_t), ('peak_job_memory', ctypes.c_size_t)]

        self.kernel = ctypes.WinDLL('kernel32', use_last_error=True)
        self.kernel.CreateJobObjectW.argtypes = [ctypes.c_void_p, wintypes.LPCWSTR]
        self.kernel.CreateJobObjectW.restype = wintypes.HANDLE
        self.kernel.SetInformationJobObject.argtypes = [wintypes.HANDLE, ctypes.c_int, ctypes.c_void_p, wintypes.DWORD]
        self.kernel.SetInformationJobObject.restype = wintypes.BOOL
        self.kernel.AssignProcessToJobObject.argtypes = [wintypes.HANDLE, wintypes.HANDLE]
        self.kernel.AssignProcessToJobObject.restype = wintypes.BOOL
        self.kernel.CloseHandle.argtypes = [wintypes.HANDLE]
        self.kernel.CloseHandle.restype = wintypes.BOOL
        self.handle = self.kernel.CreateJobObjectW(None, None)
        if not self.handle:
            raise ctypes.WinError(ctypes.get_last_error())
        limits = ExtendedLimits()
        limits.basic.flags = 0x2000  # JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
        try:
            if not self.kernel.SetInformationJobObject(self.handle, 9, ctypes.byref(limits), ctypes.sizeof(limits)):
                raise ctypes.WinError(ctypes.get_last_error())
            if not self.kernel.AssignProcessToJobObject(self.handle, wintypes.HANDLE(int(process._handle))):
                raise ctypes.WinError(ctypes.get_last_error())
        except Exception:
            self.close()
            raise

    def close(self):
        if self.handle:
            handle, self.handle = self.handle, None
            self.kernel.CloseHandle(handle)


def spawn(args, **kwargs):
    if os.name == 'nt':
        kwargs['creationflags'] = subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.CREATE_NO_WINDOW
    else:
        kwargs['start_new_session'] = True
    process = subprocess.Popen(args, **kwargs)
    process._arena_job = None
    try:
        if os.name == 'nt':
            process._arena_job = WindowsJob(process)
    except Exception:
        process.kill()
        try:
            process.wait(timeout=2)
        except subprocess.TimeoutExpired:
            pass
        raise RuntimeError('Could not establish subprocess-tree ownership; execution stopped')
    return process


def stop_tree(process):
    """Target only descendants owned by this invocation, never global names/ports."""
    if os.name == 'nt':
        if process._arena_job:
            process._arena_job.close()
    else:
        try:
            os.killpg(process.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
    if process.poll() is None:
        process.kill()
    try:
        process.wait(timeout=2)
    except subprocess.TimeoutExpired as error:
        raise RuntimeError('Owned process did not exit within the cleanup deadline') from error


def communicate(process, timeout, input_text=None):
    try:
        return process.communicate(input=input_text, timeout=timeout)
    except subprocess.TimeoutExpired as original:
        stop_tree(process)
        try:
            output, errors = process.communicate(timeout=2)
        except subprocess.TimeoutExpired as error:
            # Never perform an unbounded second communicate(), even on cleanup failure.
            raise RuntimeError('Owned process output did not close within the cleanup deadline') from error
        raise subprocess.TimeoutExpired(process.args, timeout, output=output, stderr=errors) from original


def run(args, cwd, timeout=60, input_text=None, stderr=None):
    process = spawn(args, cwd=cwd, stdin=subprocess.PIPE if input_text is not None else subprocess.DEVNULL,
                    stdout=subprocess.PIPE, stderr=subprocess.PIPE if stderr is None else stderr,
                    text=True, encoding='utf-8', errors='replace')
    try:
        output, errors = communicate(process, timeout, input_text)
        return subprocess.CompletedProcess(args, process.returncode, output, errors)
    finally:
        stop_tree(process)
