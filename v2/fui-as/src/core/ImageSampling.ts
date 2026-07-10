import { ImageSamplingKind } from "./ffi";

export class ImageSampling {
  private static LINEAR: ImageSampling = new ImageSampling(ImageSamplingKind.Linear, 0);
  private static NEAREST: ImageSampling = new ImageSampling(ImageSamplingKind.Nearest, 0);
  private static LINEAR_MIPMAP_NEAREST: ImageSampling = new ImageSampling(ImageSamplingKind.LinearMipmapNearest, 0);
  private static LINEAR_MIPMAP_LINEAR: ImageSampling = new ImageSampling(ImageSamplingKind.LinearMipmapLinear, 0);
  private static CUBIC_MITCHELL: ImageSampling = new ImageSampling(ImageSamplingKind.CubicMitchell, 0);
  private static CUBIC_CATMULL_ROM: ImageSampling = new ImageSampling(ImageSamplingKind.CubicCatmullRom, 0);

  static linear(): ImageSampling {
    return ImageSampling.LINEAR;
  }

  static nearest(): ImageSampling {
    return ImageSampling.NEAREST;
  }

  static linearMipmapNearest(): ImageSampling {
    return ImageSampling.LINEAR_MIPMAP_NEAREST;
  }

  static linearMipmapLinear(): ImageSampling {
    return ImageSampling.LINEAR_MIPMAP_LINEAR;
  }

  static cubicMitchell(): ImageSampling {
    return ImageSampling.CUBIC_MITCHELL;
  }

  static cubicCatmullRom(): ImageSampling {
    return ImageSampling.CUBIC_CATMULL_ROM;
  }

  static anisotropic(maxAniso: u32 = 8): ImageSampling {
    return new ImageSampling(ImageSamplingKind.Anisotropic, maxAniso);
  }

  private constructor(
    public readonly kind: ImageSamplingKind,
    public readonly maxAniso: u32,
  ) {}
}
