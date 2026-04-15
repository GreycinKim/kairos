/** Pin on a workspace atlas plate (catalog entry id + normalized position on the image). */
export type AtlasMapPin = {
  catalogMapId: string;
  /** 0 = left edge, 1 = right edge of the map image */
  nx: number;
  /** 0 = top, 1 = bottom */
  ny: number;
};
