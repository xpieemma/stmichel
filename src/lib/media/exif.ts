/**
 * Zero-dependency EXIF orientation extractor.
 * Reads only the first 64 KB of a JPEG file, locates the APP1 marker,
 * and returns the Orientation value (1–8).  Returns 1 (normal) on any error
 * or if the tag is absent.
 */
export async function getOrientation(file: File): Promise<number> {
  try {
    const slice = file.slice(0, 65536); // only need the header
    const buffer = await slice.arrayBuffer();
    const view = new DataView(buffer);

    // Must be a JPEG (SOI marker)
    if (view.getUint16(0, false) !== 0xffd8) return 1;

    let offset = 2;
    while (offset < view.byteLength) {
      const marker = view.getUint16(offset, false);
      offset += 2;

      // APP1 marker
      if (marker === 0xffe1) {
        const exifLength = view.getUint16(offset, false);
        const exifStart = offset + 2;

        // Look for "Exif\0\0" header
        if (exifStart + 6 > view.byteLength) return 1;
        const exifHeader = String.fromCharCode(
          view.getUint8(exifStart),
          view.getUint8(exifStart + 1),
          view.getUint8(exifStart + 2),
          view.getUint8(exifStart + 3)
        );
        if (exifHeader !== 'Exif') return 1;

        // TIFF header
        const tiffStart = exifStart + 6;
        const littleEndian = view.getUint16(tiffStart, false) === 0x4949; // 'II'
        const bigEndian = view.getUint16(tiffStart, false) === 0x4d4d;   // 'MM'
        if (!littleEndian && !bigEndian) return 1;

        const le = littleEndian; // true for little-endian
        const firstIFDOffset = view.getUint32(tiffStart + 4, le);
        if (firstIFDOffset + 2 > exifLength) return 1;

        const ifdOffset = tiffStart + firstIFDOffset;
        const entries = view.getUint16(ifdOffset, le);

        for (let i = 0; i < entries; i++) {
          const entryOffset = ifdOffset + 2 + i * 12;
          if (entryOffset + 12 > view.byteLength) break;
          const tag = view.getUint16(entryOffset, le);
          if (tag === 0x0112) { // Orientation tag
            const type = view.getUint16(entryOffset + 2, le);
            const count = view.getUint32(entryOffset + 4, le);
            if (type === 3 && count === 1) { // SHORT, 1 value
              return view.getUint16(entryOffset + 8, le);
            }
          }
        }
        // tag not found in this IFD
        return 1;
      } else {
        // Non-APP1 markers: skip the segment
        const length = view.getUint16(offset, false);
        if (length < 2) return 1; // invalid segment
        offset += length;
      }
    }
    return 1;
  } catch {
    return 1; // any error -> assume normal
  }
}