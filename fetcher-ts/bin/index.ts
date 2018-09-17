import * as command from "commander";
import * as request from "superagent";
import * as cheerio from "cheerio";
import * as fs from "fs";

interface Film {
  id: string,
  name: string,
  cover: string,
  rating?: number,
}

type MaybeFilm = Film | void;

const MAIN_URL = "http://gidonline.in";
const POSTS_ID = "#posts a";
const MAX_CONCURRENCY = 10;
let MAX_PAGE = 100;
const DATA_FILE = "data.json";

let state = {
  films: {},
  page: MAX_CONCURRENCY,
};

const pageUrl = (page: number) => MAIN_URL + "/rating/page/" + page + "/";

const parsePost = (index: number, el: CheerioElement): MaybeFilm => {
  return {
    id: el.attribs["href"],
    name: el.childNodes[1].children[0].data,
    cover: el.childNodes[0].attribs["src"],
    rating: parseFloat(el.childNodes[2].children[0].attribs["alt"].split("average: ")[1].split(" out of")[0].trim()),
  };
};

const parsePage = (text: string): Film[] => {
  const $ = cheerio.load(text);
  const posts = $(POSTS_ID);
  const films = [];
  posts.each((i, el) => {
    films.push(parsePost(i, el));
  });
  return films;
};

const loadPage = async (page: number) => {
  const {text} = await request.get(pageUrl(page));
  return text;
};

const loadAndParsePage = async (page: number) => {
  const text = await loadPage(page);
  return parsePage(text);
};

const range = (from: number, to: number) => [...Array(to - from)].map((el, i) => i + from);

const loadAllPages = async (i: number) => {
  if (i >= MAX_PAGE) {
    return;
  }

  const files = await loadAndParsePage(i);
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
};

command
  .action(async () => {
    try {
      state = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      MAX_PAGE = MAX_PAGE + state.page;
      console.log(state);
    } catch (e) {
      // ok no saved state;
    }

    if (state.page < MAX_PAGE) {
      await Promise.all(
        range(state.page, MAX_PAGE)
          .map(loadAllPages),
      );

      fs.writeFileSync(DATA_FILE, JSON.stringify(state), "utf8");
    }

  });

command
  .parse(process.argv);