import signal
import time
import traceback

# Only block truly dangerous modules — Docker provides container-level isolation.
# os/sys/socket must remain accessible so LangChain tools can make network calls.
BLOCKED_MODULES = {"subprocess", "pty", "ctypes"}
EXECUTION_TIMEOUT_SECONDS = 30


def _make_safe_import(original_import):
    def safe_import(name, *args, **kwargs):
        root = name.split(".")[0]
        if root in BLOCKED_MODULES:
            raise ImportError(f"Module '{name}' is blocked in the sandbox.")
        return original_import(name, *args, **kwargs)
    return safe_import


def _timeout_handler(signum, frame):
    raise TimeoutError(f"Tool execution exceeded {EXECUTION_TIMEOUT_SECONDS}s timeout.")


def run_tool(code: str, function_name: str, input_data: str) -> dict:
    import builtins as _builtins

    start = time.time()

    try:
        signal.signal(signal.SIGALRM, _timeout_handler)
        signal.alarm(EXECUTION_TIMEOUT_SECONDS)
    except (AttributeError, ValueError, OSError):
        pass  # Windows (no SIGALRM) or non-main thread (FastAPI threadpool)

    try:
        # Build a namespace with full builtins but a patched __import__
        safe_builtins = vars(_builtins).copy()
        safe_builtins["__import__"] = _make_safe_import(safe_builtins["__import__"])

        namespace = {"__builtins__": safe_builtins}

        exec(compile(code, "<tool>", "exec"), namespace)  # noqa: S102

        fn = namespace.get(function_name)
        if fn is None:
            return {"output": None, "error": f"Function '{function_name}' not found in tool code.", "executionMs": 0}

        result = fn(input_data)
        elapsed = int((time.time() - start) * 1000)
        return {"output": str(result), "error": None, "executionMs": elapsed}

    except TimeoutError as e:
        return {"output": None, "error": str(e), "executionMs": EXECUTION_TIMEOUT_SECONDS * 1000}
    except Exception:
        elapsed = int((time.time() - start) * 1000)
        return {"output": None, "error": traceback.format_exc(), "executionMs": elapsed}
    finally:
        try:
            signal.alarm(0)
        except AttributeError:
            pass
