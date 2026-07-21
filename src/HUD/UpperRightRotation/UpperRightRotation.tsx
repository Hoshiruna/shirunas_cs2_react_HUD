import { useEffect, useMemo, useState } from "react";
import { configs } from "../../API/contexts/actions";
import "./upper-right-rotation.scss";

interface RotationImage {
  image_url: string;
  duration_seconds: number;
}

interface UpperRightRotationConfig {
  image_count: number;
  images: RotationImage[];
}

const isRotationImage = (image: unknown): image is RotationImage => {
  if (!image || typeof image !== "object" || Array.isArray(image)) return false;
  const candidate = image as Record<string, unknown>;
  if (
    !(
      typeof candidate.image_url === "string" &&
      typeof candidate.duration_seconds === "number" &&
      Number.isInteger(candidate.duration_seconds) &&
      candidate.duration_seconds > 0
    )
  ) {
    return false;
  }

  try {
    const url = new URL(candidate.image_url);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const readRotationConfig = (data: unknown): UpperRightRotationConfig | null => {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const config = (data as Record<string, unknown>).upper_right_rotation;
  if (!config || typeof config !== "object" || Array.isArray(config)) return null;
  const candidate = config as Record<string, unknown>;
  if (
    typeof candidate.image_count !== "number" ||
    !Number.isInteger(candidate.image_count) ||
    candidate.image_count < 1 ||
    candidate.image_count > 10 ||
    !Array.isArray(candidate.images) ||
    candidate.images.length !== candidate.image_count
  ) {
    return null;
  }

  const images = candidate.images.filter(isRotationImage);
  if (images.length !== candidate.image_count) return null;
  return { image_count: images.length, images };
};

const rotationSignature = (config: UpperRightRotationConfig | null) =>
  config?.images.map((image) => `${image.image_url}:${image.duration_seconds}`).join("|") ?? "";

const UpperRightRotation = () => {
  const [config, setConfig] = useState<UpperRightRotationConfig | null>(() =>
    readRotationConfig(configs.data),
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedImageUrls, setFailedImageUrls] = useState<string[]>([]);
  const signature = rotationSignature(config);
  const availableImages = useMemo(
    () => config?.images.filter((image) => !failedImageUrls.includes(image.image_url)) ?? [],
    [config, failedImageUrls],
  );

  useEffect(() => {
    const onConfigChange = (data: unknown) => {
      const nextConfig = readRotationConfig(data);
      setConfig((currentConfig) =>
        rotationSignature(currentConfig) === rotationSignature(nextConfig)
          ? currentConfig
          : nextConfig,
      );
    };
    configs.onChange(onConfigChange);
    onConfigChange(configs.data);
    return () => configs.off(onConfigChange);
  }, []);

  useEffect(() => {
    setCurrentIndex(0);
    setFailedImageUrls([]);
  }, [signature]);

  useEffect(() => {
    setCurrentIndex((index) => (availableImages.length ? index % availableImages.length : 0));
  }, [availableImages.length]);

  useEffect(() => {
    if (availableImages.length < 2) return;
    const currentImage = availableImages[currentIndex];
    if (!currentImage) return;
    const timer = window.setTimeout(() => {
      setCurrentIndex((index) => (index + 1) % availableImages.length);
    }, currentImage.duration_seconds * 1000);
    return () => window.clearTimeout(timer);
  }, [availableImages, currentIndex]);

  const currentImage = availableImages.length
    ? availableImages[currentIndex % availableImages.length]
    : undefined;
  if (!currentImage) return null;

  return (
    <div className="upper-right-rotation" aria-hidden="true">
      <img
        key={`${currentIndex}-${currentImage.image_url}`}
        src={currentImage.image_url}
        alt=""
        onError={() => {
          setFailedImageUrls((failedUrls) =>
            failedUrls.includes(currentImage.image_url)
              ? failedUrls
              : [...failedUrls, currentImage.image_url],
          );
        }}
      />
    </div>
  );
};

export default UpperRightRotation;
