import * as ImageManipulator from 'expo-image-manipulator';

export async function compressImage(uri, maxWidth = 1280) {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: maxWidth } }],
    { compress: 0.72, format: ImageManipulator.SaveFormat.JPEG }
  );

  return result.uri;
}

export async function fileUriToArrayBuffer(uri) {
  const response = await fetch(uri);
  return response.arrayBuffer();
}
