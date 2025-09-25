const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const { requireAdminOrSuper } = require('../middleware/auth');

function parseArray(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writePopupBanners(banners, updatedBy = 'admin') {
  const value = JSON.stringify(banners);
  await Setting.findOneAndUpdate(
    { key: 'popupBanners' },
    { key: 'popupBanners', value },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  try {
    const publicSite = await Setting.findOne({ key: 'publicSite' });
    if (!publicSite) return;

    let data = {};
    if (typeof publicSite.value === 'string') {
      try { data = JSON.parse(publicSite.value) || {}; } catch { data = {}; }
    }
    if (!data || typeof data !== 'object') data = {};
    data.popupBanners = banners;

    await Setting.findOneAndUpdate(
      { key: 'publicSite' },
      {
        key: 'publicSite',
        value: JSON.stringify(data),
        data,
        updatedAt: new Date(),
        updatedBy,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[adminPopupBannerRoutes] failed to mirror publicSite popupBanners', err);
    }
  }
}

router.get('/', requireAdminOrSuper, async (_req, res) => {
  try {
    const doc = await Setting.findOne({ key: 'popupBanners' }).lean();
    const popupBanners = parseArray(doc?.value);
    res.json({ ok: true, popupBanners });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'failed to load popup banners', error: String(err?.message || err) });
  }
});

router.put('/', requireAdminOrSuper, async (req, res) => {
  try {
    const banners = Array.isArray(req.body?.popupBanners) ? req.body.popupBanners : [];
    await writePopupBanners(banners, req.user?._id || 'admin');
    res.json({ ok: true, popupBanners: banners });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'failed to save popup banners', error: String(err?.message || err) });
  }
});

module.exports = router;
