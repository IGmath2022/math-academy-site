const express = require("express");
const router = express.Router();
const Parser = require("rss-parser");
const parser = new Parser();

const NAVER_BLOG_RSS = "https://rss.blog.naver.com/igmath2022.xml";

router.get("/", async (req, res) => {
  try {
    const feed = await parser.parseURL(NAVER_BLOG_RSS);
    const list = feed.items.slice(0, 7).map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      summary: item.contentSnippet,
    }));
    res.json(list);
  } catch (e) {
    console.log("네이버블로그 연동 오류:", e);
    res.status(500).json({ error: "네이버 블로그 연동 오류" });
  }
});

module.exports = router;