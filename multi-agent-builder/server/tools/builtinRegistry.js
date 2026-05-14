export const BUILTIN_TOOLS = [
  // ── Search ──────────────────────────────────────────────────────────────────
  {
    id: "DuckDuckGoSearchRun",
    name: "DuckDuckGoSearchRun",
    module: "langchain_community.tools",
    package: "ddgs",
    description: "Web search via DuckDuckGo"
  },
  {
    id: "WikipediaQueryRun",
    name: "WikipediaQueryRun",
    module: "langchain_community.tools",
    package: "wikipedia",
    description: "Query Wikipedia articles",
    setupCode: "from langchain_community.utilities import WikipediaAPIWrapper",
    constructorArgs: "api_wrapper=WikipediaAPIWrapper()"
  },
  {
    id: "ArxivQueryRun",
    name: "ArxivQueryRun",
    module: "langchain_community.tools",
    package: "arxiv",
    description: "Search academic papers on arXiv",
    setupCode: "from langchain_community.utilities import ArxivAPIWrapper",
    constructorArgs: "api_wrapper=ArxivAPIWrapper()"
  },
  {
    id: "YouTubeSearchTool",
    name: "YouTubeSearchTool",
    module: "langchain_community.tools",
    package: "youtube-search-python",
    description: "Search YouTube videos"
  },
  {
    id: "BraveSearch",
    name: "BraveSearch",
    module: "langchain_community.tools",
    package: null,
    description: "Web search via Brave Search API (requires BRAVE_API_KEY env var)"
  },
  {
    id: "GoogleSerperRun",
    name: "GoogleSerperRun",
    module: "langchain_community.tools",
    package: "google-search-results",
    description: "Google search via Serper API (requires SERPER_API_KEY env var)"
  },

  // ── Code execution ───────────────────────────────────────────────────────────
  {
    id: "PythonREPLTool",
    name: "PythonREPLTool",
    module: "langchain_experimental.tools",
    package: "langchain-experimental",
    description: "Execute Python code snippets"
  },

  // ── Math ─────────────────────────────────────────────────────────────────────
  {
    id: "Calculator",
    name: "Calculator",
    module: null,
    package: null,
    description: "Evaluate mathematical expressions safely",
    // Uses Python's ast to eval math expressions without any dangerous builtins
    fullCode: [
      "import ast, math",
      "def _run_builtin(input: str):",
      "    _env = {k: getattr(math, k) for k in dir(math) if not k.startswith('_')}",
      "    _env['abs'] = abs; _env['round'] = round; _env['pow'] = pow",
      "    try:",
      "        result = eval(compile(ast.parse(input.strip(), mode='eval'), '<calc>', 'eval'), {'__builtins__': {}}, _env)",
      "        return str(result)",
      "    except Exception as e:",
      "        return f'Error: {e}'"
    ].join("\n")
  },

  // ── File management ──────────────────────────────────────────────────────────
  {
    id: "ReadFileTool",
    name: "ReadFileTool",
    module: "langchain_community.tools.file_management",
    package: null,
    description: "Read the contents of a file in the sandbox (/tmp)",
    constructorArgs: 'root_dir="/tmp"'
  },
  {
    id: "WriteFileTool",
    name: "WriteFileTool",
    module: "langchain_community.tools.file_management",
    package: null,
    description: "Write content to a file in the sandbox (/tmp)",
    constructorArgs: 'root_dir="/tmp"'
  },

  // ── HTTP ─────────────────────────────────────────────────────────────────────
  {
    id: "RequestsGetTool",
    name: "RequestsGetTool",
    module: "langchain_community.tools",
    package: "requests",
    description: "Make HTTP GET requests and return the response text",
    setupCode: "from langchain_community.utilities import TextRequestsWrapper",
    constructorArgs: "requests_wrapper=TextRequestsWrapper()"
  },
  {
    id: "RequestsPostTool",
    name: "RequestsPostTool",
    module: "langchain_community.tools",
    package: "requests",
    description: "Make HTTP POST requests and return the response text",
    setupCode: "from langchain_community.utilities import TextRequestsWrapper",
    constructorArgs: "requests_wrapper=TextRequestsWrapper()"
  },

  // ── Data ─────────────────────────────────────────────────────────────────────
  {
    id: "JsonGetValueTool",
    name: "JsonGetValueTool",
    module: null,
    package: null,
    description: "Extract a value from JSON by dot-notation path. Input: 'key.subkey | {\"key\":{\"subkey\":\"value\"}}'",
    fullCode: [
      "import json",
      "def _run_builtin(input: str):",
      "    try:",
      "        if '|' in input:",
      "            path, json_str = input.split('|', 1)",
      "            data = json.loads(json_str.strip())",
      "            for key in path.strip().split('.'):",
      "                data = data[key] if isinstance(data, dict) else data[int(key)]",
      "            return str(data)",
      "        return json.dumps(json.loads(input.strip()), indent=2)",
      "    except Exception as e:",
      "        return f'Error: {e}'"
    ].join("\n")
  }
];

export function getToolById(idOrName) {
  return BUILTIN_TOOLS.find((t) => t.id === idOrName || t.name === idOrName) || null;
}

export function resolvePackages(toolIds = []) {
  return [...new Set(
    toolIds
      .map((id) => getToolById(id)?.package)
      .filter(Boolean)
  )];
}
