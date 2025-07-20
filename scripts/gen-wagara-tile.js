import sharp from 'sharp';

const SRC  = 'assets/wagara-bg.png';
const DEST = 'assets/wagara-tile.png';

(async () => {
  await sharp(SRC)
    .resize(256, 256, { fit: 'cover', position: 'center' })
    .toFile(DEST);
  console.log(`✅ ${DEST} created`);
})();
