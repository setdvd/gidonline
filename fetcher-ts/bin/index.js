"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const command = require("commander");
const request = require("superagent");
const cheerio = require("cheerio");
const fs = require("fs");
const MAIN_URL = "http://gidonline.in";
const POSTS_ID = "#posts a";
const MAX_CONCURRENCY = 10;
let MAX_PAGE = 100;
const DATA_FILE = "data.json";
let state = {
    films: {},
    page: MAX_CONCURRENCY,
};
const pageUrl = (page) => MAIN_URL + "/rating/page/" + page + "/";
const parsePost = (index, el) => {
    return {
        id: el.attribs["href"],
        name: el.childNodes[1].children[0].data,
        cover: el.childNodes[0].attribs["src"],
        rating: parseFloat(el.childNodes[2].children[0].attribs["alt"].split("average: ")[1].split(" out of")[0].trim()),
    };
};
const parsePage = (text) => {
    const $ = cheerio.load(text);
    const posts = $(POSTS_ID);
    const films = [];
    posts.each((i, el) => {
        films.push(parsePost(i, el));
    });
    return films;
};
const loadPage = (page) => __awaiter(this, void 0, void 0, function* () {
    const { text } = yield request.get(pageUrl(page));
    return text;
});
const loadAndParsePage = (page) => __awaiter(this, void 0, void 0, function* () {
    const text = yield loadPage(page);
    return parsePage(text);
});
const range = (from, to) => [...Array(to - from)].map((el, i) => i + from);
const loadAllPages = (i) => __awaiter(this, void 0, void 0, function* () {
    if (i >= MAX_PAGE) {
        return;
    }
    const files = yield loadAndParsePage(i);
    files.forEach((film) => {
        state.films[film.id] = film;
    });
    const nextPage = state.page + 1;
    let res;
    if (nextPage < MAX_PAGE) {
        state.page = nextPage;
        res = loadAllPages(nextPage);
    }
    return res;
});
command
    .action(() => __awaiter(this, void 0, void 0, function* () {
    try {
        state = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
        MAX_PAGE = MAX_PAGE + state.page;
        console.log(state);
    }
    catch (e) {
        // ok no saved state;
    }
    if (state.page < MAX_PAGE) {
        yield Promise.all(range(state.page, MAX_PAGE)
            .map(loadAllPages));
        fs.writeFileSync(DATA_FILE, JSON.stringify(state), "utf8");
    }
}));
command
    .parse(process.argv);
//# sourceMappingURL=index.js.map