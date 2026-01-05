import { IIIFResource, Image, IIIFManifest, IIIFCanvas, IIIFAnnotationPage, IIIFAnnotation } from '../types';
import { CONFIG } from '../config';

export function buildManifestV3(resource: IIIFResource, images: Image[]): IIIFManifest {
  const manifestId = `${CONFIG.baseUrl}/iiif/manifests/${resource.id}/manifest.json`;
  const baseUrl = CONFIG.baseUrl;

  // Sort images by order_index
  const sortedImages = [...images].sort((a, b) => a.order_index - b.order_index);

  // Build canvases
  const canvases: IIIFCanvas[] = sortedImages
    .filter(img => img.status === 'ready' && img.width && img.height)
    .map((image, index) => {
      const canvasId = `${baseUrl}/iiif/manifests/${resource.id}/canvas/${index}`;
      const annotationPageId = `${canvasId}/page`;
      const annotationId = `${canvasId}/annotation`;

      // Extract filename with extension for IIIF image ID (Cantaloupe needs the full filename)
      const ptiffFilename = image.ptiff_path?.split('/').pop() || `${image.id}.tif`;
      // Use public URL for external access (browser-accessible URL)
      const imageServiceId = `${CONFIG.cantaloupePublicUrl}/${ptiffFilename.replace(/\.tif$/, '')}`;

      const annotation: IIIFAnnotation = {
        id: annotationId,
        type: 'Annotation',
        motivation: 'painting',
        target: canvasId,
        body: {
          id: `${imageServiceId}/full/max/0/default.jpg`,
          type: 'Image',
          format: 'image/jpeg',
          width: image.width!,
          height: image.height!,
          service: [
            {
              id: imageServiceId,
              type: 'ImageService2',
              profile: 'level2',
            },
          ],
        },
      };

      const annotationPage: IIIFAnnotationPage = {
        id: annotationPageId,
        type: 'AnnotationPage',
        items: [annotation],
      };

      const canvas: IIIFCanvas = {
        id: canvasId,
        type: 'Canvas',
        label: { ja: [image.original_filename] },
        width: image.width!,
        height: image.height!,
        items: [annotationPage],
      };

      return canvas;
    });

  // Build manifest
  const manifest: IIIFManifest = {
    '@context': 'http://iiif.io/api/presentation/3/context.json',
    id: manifestId,
    type: 'Manifest',
    label: {
      none: [resource.title],
      ja: [resource.title]
    },
    items: canvases,
  };

  // Add thumbnail (1st image as 300x300 JPEG)
  if (sortedImages.length > 0 && sortedImages[0].status === 'ready') {
    const firstImage = sortedImages[0];
    const thumbnailFilename = firstImage.ptiff_path?.split('/').pop()?.replace(/\.tif$/, '') || firstImage.id;

    manifest.thumbnail = [{
      id: `${CONFIG.cantaloupePublicUrl}/${thumbnailFilename}/full/!300,300/0/default.jpg`,
      type: 'Image',
      format: 'image/jpeg',
    }];
  }

  // Add optional metadata
  if (resource.description) {
    manifest.summary = {
      none: [resource.description],
      ja: [resource.description]
    };
  }

  if (resource.attribution) {
    manifest.requiredStatement = {
      label: {
        none: ['帰属'],
        ja: ['帰属']
      },
      value: {
        none: [resource.attribution],
        ja: [resource.attribution]
      },
    };
  }

  if (resource.license) {
    manifest.rights = resource.license;
  }

  // Add homepage if present
  if (resource.homepage) {
    manifest.homepage = [{
      id: resource.homepage,
      type: 'Text',
      label: {
        none: ['ホームページ'],
        ja: ['ホームページ']
      },
      format: 'text/html',
    }];
  }

  // Add viewingDirection if present
  if (resource.viewing_direction) {
    manifest.viewingDirection = resource.viewing_direction;
  }

  // Add custom metadata if present
  if (resource.metadata) {
    try {
      const customMetadata = JSON.parse(resource.metadata);
      if (Array.isArray(customMetadata)) {
        manifest.metadata = customMetadata.map((item: any) => ({
          label: {
            none: [item.label],
            ja: [item.label]
          },
          value: {
            none: [item.value],
            ja: [item.value]
          },
        }));
      }
    } catch (e) {
      // Ignore invalid JSON
    }
  }

  return manifest;
}
