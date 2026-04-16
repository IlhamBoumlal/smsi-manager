import { API_BASE_URL, buildApiUrl, resolveAssetUrl } from './url';

describe('url helpers', () => {
  test('buildApiUrl uses base url for relative path', () => {
    expect(buildApiUrl('/api/pdca/cycles')).toBe(`${API_BASE_URL}/api/pdca/cycles`);
    expect(buildApiUrl('api/pdca/cycles')).toBe(`${API_BASE_URL}/api/pdca/cycles`);
  });

  test('resolveAssetUrl keeps absolute http url unchanged', () => {
    const absolute = 'https://cdn.example.com/logo.png';
    expect(resolveAssetUrl(absolute)).toBe(absolute);
  });

  test('resolveAssetUrl prefixes relative path with api base url', () => {
    expect(resolveAssetUrl('/uploads/logo.png')).toBe(`${API_BASE_URL}/uploads/logo.png`);
  });

  test('resolveAssetUrl returns fallback for empty path', () => {
    expect(resolveAssetUrl('', 'fallback.png')).toBe('fallback.png');
    expect(resolveAssetUrl(null, 'fallback.png')).toBe('fallback.png');
  });
});
