"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/auth/[...nextauth]/route";
exports.ids = ["app/api/auth/[...nextauth]/route"];
exports.modules = {

/***/ "./action-async-storage.external":
/*!*******************************************************************************!*\
  !*** external "next/dist/client/components/action-async-storage.external.js" ***!
  \*******************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/action-async-storage.external.js");

/***/ }),

/***/ "./request-async-storage.external":
/*!********************************************************************************!*\
  !*** external "next/dist/client/components/request-async-storage.external.js" ***!
  \********************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/request-async-storage.external.js");

/***/ }),

/***/ "./static-generation-async-storage.external":
/*!******************************************************************************************!*\
  !*** external "next/dist/client/components/static-generation-async-storage.external.js" ***!
  \******************************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/static-generation-async-storage.external.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "assert":
/*!*************************!*\
  !*** external "assert" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("assert");

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("buffer");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("events");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

module.exports = require("https");

/***/ }),

/***/ "querystring":
/*!******************************!*\
  !*** external "querystring" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("querystring");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("url");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("util");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("zlib");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.js&appDir=C%3A%5CUsers%5CShrey%5CDesktop%5CDriverDirect%5Cmulti-agent-builder%5Cclient%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CShrey%5CDesktop%5CDriverDirect%5Cmulti-agent-builder%5Cclient&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.js&appDir=C%3A%5CUsers%5CShrey%5CDesktop%5CDriverDirect%5Cmulti-agent-builder%5Cclient%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CShrey%5CDesktop%5CDriverDirect%5Cmulti-agent-builder%5Cclient&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var C_Users_Shrey_Desktop_DriverDirect_multi_agent_builder_client_src_app_api_auth_nextauth_route_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./src/app/api/auth/[...nextauth]/route.js */ \"(rsc)/./src/app/api/auth/[...nextauth]/route.js\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/auth/[...nextauth]/route\",\n        pathname: \"/api/auth/[...nextauth]\",\n        filename: \"route\",\n        bundlePath: \"app/api/auth/[...nextauth]/route\"\n    },\n    resolvedPagePath: \"C:\\\\Users\\\\Shrey\\\\Desktop\\\\DriverDirect\\\\multi-agent-builder\\\\client\\\\src\\\\app\\\\api\\\\auth\\\\[...nextauth]\\\\route.js\",\n    nextConfigOutput,\n    userland: C_Users_Shrey_Desktop_DriverDirect_multi_agent_builder_client_src_app_api_auth_nextauth_route_js__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks } = routeModule;\nconst originalPathname = \"/api/auth/[...nextauth]/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZhdXRoJTJGJTVCLi4ubmV4dGF1dGglNUQlMkZyb3V0ZSZwYWdlPSUyRmFwaSUyRmF1dGglMkYlNUIuLi5uZXh0YXV0aCU1RCUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmFwaSUyRmF1dGglMkYlNUIuLi5uZXh0YXV0aCU1RCUyRnJvdXRlLmpzJmFwcERpcj1DJTNBJTVDVXNlcnMlNUNTaHJleSU1Q0Rlc2t0b3AlNUNEcml2ZXJEaXJlY3QlNUNtdWx0aS1hZ2VudC1idWlsZGVyJTVDY2xpZW50JTVDc3JjJTVDYXBwJnBhZ2VFeHRlbnNpb25zPXRzeCZwYWdlRXh0ZW5zaW9ucz10cyZwYWdlRXh0ZW5zaW9ucz1qc3gmcGFnZUV4dGVuc2lvbnM9anMmcm9vdERpcj1DJTNBJTVDVXNlcnMlNUNTaHJleSU1Q0Rlc2t0b3AlNUNEcml2ZXJEaXJlY3QlNUNtdWx0aS1hZ2VudC1idWlsZGVyJTVDY2xpZW50JmlzRGV2PXRydWUmdHNjb25maWdQYXRoPXRzY29uZmlnLmpzb24mYmFzZVBhdGg9JmFzc2V0UHJlZml4PSZuZXh0Q29uZmlnT3V0cHV0PSZwcmVmZXJyZWRSZWdpb249Jm1pZGRsZXdhcmVDb25maWc9ZTMwJTNEISIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBc0c7QUFDdkM7QUFDYztBQUNrRTtBQUMvSTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0IsZ0hBQW1CO0FBQzNDO0FBQ0EsY0FBYyx5RUFBUztBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsWUFBWTtBQUNaLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQSxRQUFRLGlFQUFpRTtBQUN6RTtBQUNBO0FBQ0EsV0FBVyw0RUFBVztBQUN0QjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ3VIOztBQUV2SCIsInNvdXJjZXMiOlsid2VicGFjazovL211bHRpLWFnZW50LWJ1aWxkZXItY2xpZW50Lz82Mjg3Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcFJvdXRlUm91dGVNb2R1bGUgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9mdXR1cmUvcm91dGUtbW9kdWxlcy9hcHAtcm91dGUvbW9kdWxlLmNvbXBpbGVkXCI7XG5pbXBvcnQgeyBSb3V0ZUtpbmQgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9mdXR1cmUvcm91dGUta2luZFwiO1xuaW1wb3J0IHsgcGF0Y2hGZXRjaCBhcyBfcGF0Y2hGZXRjaCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2xpYi9wYXRjaC1mZXRjaFwiO1xuaW1wb3J0ICogYXMgdXNlcmxhbmQgZnJvbSBcIkM6XFxcXFVzZXJzXFxcXFNocmV5XFxcXERlc2t0b3BcXFxcRHJpdmVyRGlyZWN0XFxcXG11bHRpLWFnZW50LWJ1aWxkZXJcXFxcY2xpZW50XFxcXHNyY1xcXFxhcHBcXFxcYXBpXFxcXGF1dGhcXFxcWy4uLm5leHRhdXRoXVxcXFxyb3V0ZS5qc1wiO1xuLy8gV2UgaW5qZWN0IHRoZSBuZXh0Q29uZmlnT3V0cHV0IGhlcmUgc28gdGhhdCB3ZSBjYW4gdXNlIHRoZW0gaW4gdGhlIHJvdXRlXG4vLyBtb2R1bGUuXG5jb25zdCBuZXh0Q29uZmlnT3V0cHV0ID0gXCJcIlxuY29uc3Qgcm91dGVNb2R1bGUgPSBuZXcgQXBwUm91dGVSb3V0ZU1vZHVsZSh7XG4gICAgZGVmaW5pdGlvbjoge1xuICAgICAgICBraW5kOiBSb3V0ZUtpbmQuQVBQX1JPVVRFLFxuICAgICAgICBwYWdlOiBcIi9hcGkvYXV0aC9bLi4ubmV4dGF1dGhdL3JvdXRlXCIsXG4gICAgICAgIHBhdGhuYW1lOiBcIi9hcGkvYXV0aC9bLi4ubmV4dGF1dGhdXCIsXG4gICAgICAgIGZpbGVuYW1lOiBcInJvdXRlXCIsXG4gICAgICAgIGJ1bmRsZVBhdGg6IFwiYXBwL2FwaS9hdXRoL1suLi5uZXh0YXV0aF0vcm91dGVcIlxuICAgIH0sXG4gICAgcmVzb2x2ZWRQYWdlUGF0aDogXCJDOlxcXFxVc2Vyc1xcXFxTaHJleVxcXFxEZXNrdG9wXFxcXERyaXZlckRpcmVjdFxcXFxtdWx0aS1hZ2VudC1idWlsZGVyXFxcXGNsaWVudFxcXFxzcmNcXFxcYXBwXFxcXGFwaVxcXFxhdXRoXFxcXFsuLi5uZXh0YXV0aF1cXFxccm91dGUuanNcIixcbiAgICBuZXh0Q29uZmlnT3V0cHV0LFxuICAgIHVzZXJsYW5kXG59KTtcbi8vIFB1bGwgb3V0IHRoZSBleHBvcnRzIHRoYXQgd2UgbmVlZCB0byBleHBvc2UgZnJvbSB0aGUgbW9kdWxlLiBUaGlzIHNob3VsZFxuLy8gYmUgZWxpbWluYXRlZCB3aGVuIHdlJ3ZlIG1vdmVkIHRoZSBvdGhlciByb3V0ZXMgdG8gdGhlIG5ldyBmb3JtYXQuIFRoZXNlXG4vLyBhcmUgdXNlZCB0byBob29rIGludG8gdGhlIHJvdXRlLlxuY29uc3QgeyByZXF1ZXN0QXN5bmNTdG9yYWdlLCBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcyB9ID0gcm91dGVNb2R1bGU7XG5jb25zdCBvcmlnaW5hbFBhdGhuYW1lID0gXCIvYXBpL2F1dGgvWy4uLm5leHRhdXRoXS9yb3V0ZVwiO1xuZnVuY3Rpb24gcGF0Y2hGZXRjaCgpIHtcbiAgICByZXR1cm4gX3BhdGNoRmV0Y2goe1xuICAgICAgICBzZXJ2ZXJIb29rcyxcbiAgICAgICAgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZVxuICAgIH0pO1xufVxuZXhwb3J0IHsgcm91dGVNb2R1bGUsIHJlcXVlc3RBc3luY1N0b3JhZ2UsIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzLCBvcmlnaW5hbFBhdGhuYW1lLCBwYXRjaEZldGNoLCAgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXBwLXJvdXRlLmpzLm1hcCJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.js&appDir=C%3A%5CUsers%5CShrey%5CDesktop%5CDriverDirect%5Cmulti-agent-builder%5Cclient%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CShrey%5CDesktop%5CDriverDirect%5Cmulti-agent-builder%5Cclient&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./src/app/api/auth/[...nextauth]/route.js":
/*!*************************************************!*\
  !*** ./src/app/api/auth/[...nextauth]/route.js ***!
  \*************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ handler),\n/* harmony export */   POST: () => (/* binding */ handler),\n/* harmony export */   dynamic: () => (/* binding */ dynamic)\n/* harmony export */ });\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next-auth */ \"(rsc)/./node_modules/next-auth/index.js\");\n/* harmony import */ var next_auth_providers_google__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next-auth/providers/google */ \"(rsc)/./node_modules/next-auth/providers/google.js\");\n/* harmony import */ var next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next-auth/providers/credentials */ \"(rsc)/./node_modules/next-auth/providers/credentials.js\");\n\n\n\nconst dynamic = \"force-dynamic\";\n// next-auth v4 is CJS. In a project with \"type\":\"module\", webpack's RSC compiler\n// may hand us { default: fn } instead of fn directly — normalise either shape.\nconst NextAuth = next_auth__WEBPACK_IMPORTED_MODULE_0__[\"default\"] ?? next_auth__WEBPACK_IMPORTED_MODULE_0__;\nconst GoogleProvider = next_auth_providers_google__WEBPACK_IMPORTED_MODULE_1__[\"default\"] ?? next_auth_providers_google__WEBPACK_IMPORTED_MODULE_1__;\nconst CredentialsProvider = next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_2__[\"default\"] ?? next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_2__;\nconst BACKEND = process.env.BACKEND_URL || \"http://localhost:4000\";\nconst authOptions = {\n    trustHost: true,\n    providers: [\n        GoogleProvider({\n            clientId: process.env.GOOGLE_CLIENT_ID,\n            clientSecret: process.env.GOOGLE_CLIENT_SECRET\n        }),\n        CredentialsProvider({\n            id: \"credentials\",\n            name: \"Email\",\n            credentials: {\n                email: {\n                    label: \"Email\",\n                    type: \"email\"\n                },\n                password: {\n                    label: \"Password\",\n                    type: \"password\"\n                }\n            },\n            async authorize (credentials) {\n                if (!credentials?.email || !credentials?.password) return null;\n                try {\n                    const res = await fetch(`${BACKEND}/api/users/verify`, {\n                        method: \"POST\",\n                        headers: {\n                            \"Content-Type\": \"application/json\"\n                        },\n                        body: JSON.stringify({\n                            email: credentials.email,\n                            password: credentials.password\n                        })\n                    });\n                    if (!res.ok) return null;\n                    const { user } = await res.json();\n                    return user ? {\n                        id: user.id,\n                        email: user.email,\n                        name: user.name\n                    } : null;\n                } catch  {\n                    return null;\n                }\n            }\n        })\n    ],\n    pages: {\n        signIn: \"/login\"\n    },\n    session: {\n        strategy: \"jwt\"\n    },\n    callbacks: {\n        async jwt ({ token, user }) {\n            if (user) {\n                token.id = user.id;\n                token.email = user.email;\n                token.name = user.name;\n            }\n            return token;\n        },\n        async session ({ session, token }) {\n            if (token?.id) session.user.id = token.id;\n            if (token?.email) session.user.email = token.email;\n            if (token?.name) session.user.name = token.name;\n            return session;\n        }\n    }\n};\nconst handler = NextAuth(authOptions);\n\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvYXBwL2FwaS9hdXRoL1suLi5uZXh0YXV0aF0vcm91dGUuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQTJDO0FBQ2lCO0FBQ087QUFFNUQsTUFBTUcsVUFBVSxnQkFBZ0I7QUFFdkMsaUZBQWlGO0FBQ2pGLCtFQUErRTtBQUMvRSxNQUFNQyxXQUFvQkosaURBQWlCLElBQWFBLHNDQUFTQTtBQUNqRSxNQUFNTSxpQkFBb0JMLGtFQUF1QixJQUFPQSx1REFBZUE7QUFDdkUsTUFBTU0sc0JBQXNCTCx1RUFBNEIsSUFBSUEsNERBQW9CQTtBQUVoRixNQUFNTSxVQUFVQyxRQUFRQyxHQUFHLENBQUNDLFdBQVcsSUFBSTtBQUUzQyxNQUFNQyxjQUFjO0lBQ2xCQyxXQUFXO0lBQ1hDLFdBQVc7UUFDVFIsZUFBZTtZQUNiUyxVQUFjTixRQUFRQyxHQUFHLENBQUNNLGdCQUFnQjtZQUMxQ0MsY0FBY1IsUUFBUUMsR0FBRyxDQUFDUSxvQkFBb0I7UUFDaEQ7UUFDQVgsb0JBQW9CO1lBQ2xCWSxJQUFNO1lBQ05DLE1BQU07WUFDTkMsYUFBYTtnQkFDWEMsT0FBVTtvQkFBRUMsT0FBTztvQkFBWUMsTUFBTTtnQkFBVztnQkFDaERDLFVBQVU7b0JBQUVGLE9BQU87b0JBQVlDLE1BQU07Z0JBQVc7WUFDbEQ7WUFDQSxNQUFNRSxXQUFVTCxXQUFXO2dCQUN6QixJQUFJLENBQUNBLGFBQWFDLFNBQVMsQ0FBQ0QsYUFBYUksVUFBVSxPQUFPO2dCQUMxRCxJQUFJO29CQUNGLE1BQU1FLE1BQU0sTUFBTUMsTUFBTSxDQUFDLEVBQUVwQixRQUFRLGlCQUFpQixDQUFDLEVBQUU7d0JBQ3JEcUIsUUFBUzt3QkFDVEMsU0FBUzs0QkFBRSxnQkFBZ0I7d0JBQW1CO3dCQUM5Q0MsTUFBU0MsS0FBS0MsU0FBUyxDQUFDOzRCQUFFWCxPQUFPRCxZQUFZQyxLQUFLOzRCQUFFRyxVQUFVSixZQUFZSSxRQUFRO3dCQUFDO29CQUNyRjtvQkFDQSxJQUFJLENBQUNFLElBQUlPLEVBQUUsRUFBRSxPQUFPO29CQUNwQixNQUFNLEVBQUVDLElBQUksRUFBRSxHQUFHLE1BQU1SLElBQUlTLElBQUk7b0JBQy9CLE9BQU9ELE9BQU87d0JBQUVoQixJQUFJZ0IsS0FBS2hCLEVBQUU7d0JBQUVHLE9BQU9hLEtBQUtiLEtBQUs7d0JBQUVGLE1BQU1lLEtBQUtmLElBQUk7b0JBQUMsSUFBSTtnQkFDdEUsRUFBRSxPQUFNO29CQUNOLE9BQU87Z0JBQ1Q7WUFDRjtRQUNGO0tBQ0Q7SUFDRGlCLE9BQU87UUFDTEMsUUFBUTtJQUNWO0lBQ0FDLFNBQVM7UUFDUEMsVUFBVTtJQUNaO0lBQ0FDLFdBQVc7UUFDVCxNQUFNQyxLQUFJLEVBQUVDLEtBQUssRUFBRVIsSUFBSSxFQUFFO1lBQ3ZCLElBQUlBLE1BQU07Z0JBQ1JRLE1BQU14QixFQUFFLEdBQU1nQixLQUFLaEIsRUFBRTtnQkFDckJ3QixNQUFNckIsS0FBSyxHQUFHYSxLQUFLYixLQUFLO2dCQUN4QnFCLE1BQU12QixJQUFJLEdBQUllLEtBQUtmLElBQUk7WUFDekI7WUFDQSxPQUFPdUI7UUFDVDtRQUNBLE1BQU1KLFNBQVEsRUFBRUEsT0FBTyxFQUFFSSxLQUFLLEVBQUU7WUFDOUIsSUFBSUEsT0FBT3hCLElBQU9vQixRQUFRSixJQUFJLENBQUNoQixFQUFFLEdBQU13QixNQUFNeEIsRUFBRTtZQUMvQyxJQUFJd0IsT0FBT3JCLE9BQU9pQixRQUFRSixJQUFJLENBQUNiLEtBQUssR0FBR3FCLE1BQU1yQixLQUFLO1lBQ2xELElBQUlxQixPQUFPdkIsTUFBT21CLFFBQVFKLElBQUksQ0FBQ2YsSUFBSSxHQUFJdUIsTUFBTXZCLElBQUk7WUFDakQsT0FBT21CO1FBQ1Q7SUFDRjtBQUNGO0FBRUEsTUFBTUssVUFBVXhDLFNBQVNRO0FBRWtCIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vbXVsdGktYWdlbnQtYnVpbGRlci1jbGllbnQvLi9zcmMvYXBwL2FwaS9hdXRoL1suLi5uZXh0YXV0aF0vcm91dGUuanM/MjMyZCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgX05leHRBdXRoICAgICAgICAgIGZyb20gXCJuZXh0LWF1dGhcIjtcbmltcG9ydCBfR29vZ2xlUHJvdmlkZXIgICAgZnJvbSBcIm5leHQtYXV0aC9wcm92aWRlcnMvZ29vZ2xlXCI7XG5pbXBvcnQgX0NyZWRlbnRpYWxzUHJvdmlkZXIgZnJvbSBcIm5leHQtYXV0aC9wcm92aWRlcnMvY3JlZGVudGlhbHNcIjtcblxuZXhwb3J0IGNvbnN0IGR5bmFtaWMgPSBcImZvcmNlLWR5bmFtaWNcIjtcblxuLy8gbmV4dC1hdXRoIHY0IGlzIENKUy4gSW4gYSBwcm9qZWN0IHdpdGggXCJ0eXBlXCI6XCJtb2R1bGVcIiwgd2VicGFjaydzIFJTQyBjb21waWxlclxuLy8gbWF5IGhhbmQgdXMgeyBkZWZhdWx0OiBmbiB9IGluc3RlYWQgb2YgZm4gZGlyZWN0bHkg4oCUIG5vcm1hbGlzZSBlaXRoZXIgc2hhcGUuXG5jb25zdCBOZXh0QXV0aCAgICAgICAgICA9IF9OZXh0QXV0aC5kZWZhdWx0ICAgICAgICAgID8/IF9OZXh0QXV0aDtcbmNvbnN0IEdvb2dsZVByb3ZpZGVyICAgID0gX0dvb2dsZVByb3ZpZGVyLmRlZmF1bHQgICAgPz8gX0dvb2dsZVByb3ZpZGVyO1xuY29uc3QgQ3JlZGVudGlhbHNQcm92aWRlciA9IF9DcmVkZW50aWFsc1Byb3ZpZGVyLmRlZmF1bHQgPz8gX0NyZWRlbnRpYWxzUHJvdmlkZXI7XG5cbmNvbnN0IEJBQ0tFTkQgPSBwcm9jZXNzLmVudi5CQUNLRU5EX1VSTCB8fCBcImh0dHA6Ly9sb2NhbGhvc3Q6NDAwMFwiO1xuXG5jb25zdCBhdXRoT3B0aW9ucyA9IHtcbiAgdHJ1c3RIb3N0OiB0cnVlLFxuICBwcm92aWRlcnM6IFtcbiAgICBHb29nbGVQcm92aWRlcih7XG4gICAgICBjbGllbnRJZDogICAgIHByb2Nlc3MuZW52LkdPT0dMRV9DTElFTlRfSUQsXG4gICAgICBjbGllbnRTZWNyZXQ6IHByb2Nlc3MuZW52LkdPT0dMRV9DTElFTlRfU0VDUkVULFxuICAgIH0pLFxuICAgIENyZWRlbnRpYWxzUHJvdmlkZXIoe1xuICAgICAgaWQ6ICAgXCJjcmVkZW50aWFsc1wiLFxuICAgICAgbmFtZTogXCJFbWFpbFwiLFxuICAgICAgY3JlZGVudGlhbHM6IHtcbiAgICAgICAgZW1haWw6ICAgIHsgbGFiZWw6IFwiRW1haWxcIiwgICAgdHlwZTogXCJlbWFpbFwiICAgIH0sXG4gICAgICAgIHBhc3N3b3JkOiB7IGxhYmVsOiBcIlBhc3N3b3JkXCIsIHR5cGU6IFwicGFzc3dvcmRcIiB9LFxuICAgICAgfSxcbiAgICAgIGFzeW5jIGF1dGhvcml6ZShjcmVkZW50aWFscykge1xuICAgICAgICBpZiAoIWNyZWRlbnRpYWxzPy5lbWFpbCB8fCAhY3JlZGVudGlhbHM/LnBhc3N3b3JkKSByZXR1cm4gbnVsbDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgJHtCQUNLRU5EfS9hcGkvdXNlcnMvdmVyaWZ5YCwge1xuICAgICAgICAgICAgbWV0aG9kOiAgXCJQT1NUXCIsXG4gICAgICAgICAgICBoZWFkZXJzOiB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0sXG4gICAgICAgICAgICBib2R5OiAgICBKU09OLnN0cmluZ2lmeSh7IGVtYWlsOiBjcmVkZW50aWFscy5lbWFpbCwgcGFzc3dvcmQ6IGNyZWRlbnRpYWxzLnBhc3N3b3JkIH0pLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGlmICghcmVzLm9rKSByZXR1cm4gbnVsbDtcbiAgICAgICAgICBjb25zdCB7IHVzZXIgfSA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgICAgcmV0dXJuIHVzZXIgPyB7IGlkOiB1c2VyLmlkLCBlbWFpbDogdXNlci5lbWFpbCwgbmFtZTogdXNlci5uYW1lIH0gOiBudWxsO1xuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9KSxcbiAgXSxcbiAgcGFnZXM6IHtcbiAgICBzaWduSW46IFwiL2xvZ2luXCIsXG4gIH0sXG4gIHNlc3Npb246IHtcbiAgICBzdHJhdGVneTogXCJqd3RcIixcbiAgfSxcbiAgY2FsbGJhY2tzOiB7XG4gICAgYXN5bmMgand0KHsgdG9rZW4sIHVzZXIgfSkge1xuICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgdG9rZW4uaWQgICAgPSB1c2VyLmlkO1xuICAgICAgICB0b2tlbi5lbWFpbCA9IHVzZXIuZW1haWw7XG4gICAgICAgIHRva2VuLm5hbWUgID0gdXNlci5uYW1lO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRva2VuO1xuICAgIH0sXG4gICAgYXN5bmMgc2Vzc2lvbih7IHNlc3Npb24sIHRva2VuIH0pIHtcbiAgICAgIGlmICh0b2tlbj8uaWQpICAgIHNlc3Npb24udXNlci5pZCAgICA9IHRva2VuLmlkO1xuICAgICAgaWYgKHRva2VuPy5lbWFpbCkgc2Vzc2lvbi51c2VyLmVtYWlsID0gdG9rZW4uZW1haWw7XG4gICAgICBpZiAodG9rZW4/Lm5hbWUpICBzZXNzaW9uLnVzZXIubmFtZSAgPSB0b2tlbi5uYW1lO1xuICAgICAgcmV0dXJuIHNlc3Npb247XG4gICAgfSxcbiAgfSxcbn07XG5cbmNvbnN0IGhhbmRsZXIgPSBOZXh0QXV0aChhdXRoT3B0aW9ucyk7XG5cbmV4cG9ydCB7IGhhbmRsZXIgYXMgR0VULCBoYW5kbGVyIGFzIFBPU1QgfTtcbiJdLCJuYW1lcyI6WyJfTmV4dEF1dGgiLCJfR29vZ2xlUHJvdmlkZXIiLCJfQ3JlZGVudGlhbHNQcm92aWRlciIsImR5bmFtaWMiLCJOZXh0QXV0aCIsImRlZmF1bHQiLCJHb29nbGVQcm92aWRlciIsIkNyZWRlbnRpYWxzUHJvdmlkZXIiLCJCQUNLRU5EIiwicHJvY2VzcyIsImVudiIsIkJBQ0tFTkRfVVJMIiwiYXV0aE9wdGlvbnMiLCJ0cnVzdEhvc3QiLCJwcm92aWRlcnMiLCJjbGllbnRJZCIsIkdPT0dMRV9DTElFTlRfSUQiLCJjbGllbnRTZWNyZXQiLCJHT09HTEVfQ0xJRU5UX1NFQ1JFVCIsImlkIiwibmFtZSIsImNyZWRlbnRpYWxzIiwiZW1haWwiLCJsYWJlbCIsInR5cGUiLCJwYXNzd29yZCIsImF1dGhvcml6ZSIsInJlcyIsImZldGNoIiwibWV0aG9kIiwiaGVhZGVycyIsImJvZHkiLCJKU09OIiwic3RyaW5naWZ5Iiwib2siLCJ1c2VyIiwianNvbiIsInBhZ2VzIiwic2lnbkluIiwic2Vzc2lvbiIsInN0cmF0ZWd5IiwiY2FsbGJhY2tzIiwiand0IiwidG9rZW4iLCJoYW5kbGVyIiwiR0VUIiwiUE9TVCJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./src/app/api/auth/[...nextauth]/route.js\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/next-auth","vendor-chunks/@babel","vendor-chunks/jose","vendor-chunks/openid-client","vendor-chunks/uuid","vendor-chunks/oauth","vendor-chunks/@panva","vendor-chunks/yallist","vendor-chunks/preact-render-to-string","vendor-chunks/preact","vendor-chunks/oidc-token-hash","vendor-chunks/lru-cache","vendor-chunks/cookie"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.js&appDir=C%3A%5CUsers%5CShrey%5CDesktop%5CDriverDirect%5Cmulti-agent-builder%5Cclient%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CShrey%5CDesktop%5CDriverDirect%5Cmulti-agent-builder%5Cclient&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();