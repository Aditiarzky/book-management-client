"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
// generate-sitemap.ts (pakai tsx atau ts-node)
var promises_1 = require("fs/promises");
var path_1 = require("path");
var url_1 = require("url");
var useBookStore_ts_1 = require("./src/store/useBookStore.ts");
var useChapterStore_ts_1 = require("./src/store/useChapterStore.ts");
// __dirname support di ESM
var __filename = (0, url_1.fileURLToPath)(import.meta.url);
var __dirname = path_1["default"].dirname(__filename);
function getRoutes() {
    return __awaiter(this, void 0, void 0, function () {
        var routes, books, _loop_1, _i, books_1, book;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    routes = ['/', '/search'];
                    return [4 /*yield*/, useBookStore_ts_1["default"].getState().fetchBooks(1, 100)];
                case 1:
                    _a.sent();
                    books = useBookStore_ts_1["default"].getState().books;
                    _loop_1 = function (book) {
                        var chapters;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    routes.push("/detail/".concat(book.id));
                                    return [4 /*yield*/, useChapterStore_ts_1["default"].getState().fetchByBook(book.id)];
                                case 1:
                                    _b.sent();
                                    chapters = useChapterStore_ts_1["default"].getState().chapterByBook;
                                    routes.push.apply(routes, chapters.map(function (ch) { return "/view/".concat(book.id, "/").concat(ch.id); }));
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, books_1 = books;
                    _a.label = 2;
                case 2:
                    if (!(_i < books_1.length)) return [3 /*break*/, 5];
                    book = books_1[_i];
                    return [5 /*yield**/, _loop_1(book)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, routes];
            }
        });
    });
}
function generateSitemap() {
    return __awaiter(this, void 0, void 0, function () {
        var hostname, routes, sitemapXml, outputPath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    hostname = 'https://riztranslation.rf.gd';
                    return [4 /*yield*/, getRoutes()];
                case 1:
                    routes = _a.sent();
                    sitemapXml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
                        "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n" +
                        routes.map(function (route) { return "\n  <url>\n    <loc>".concat(hostname).concat(route, "</loc>\n  </url>"); }).join('\n') +
                        "\n</urlset>";
                    outputPath = path_1["default"].join(__dirname, 'dist', 'sitemap.xml');
                    return [4 /*yield*/, promises_1["default"].writeFile(outputPath, sitemapXml)];
                case 2:
                    _a.sent();
                    console.log('✅ Sitemap generated at dist/sitemap.xml');
                    return [2 /*return*/];
            }
        });
    });
}
generateSitemap()["catch"](console.error);
