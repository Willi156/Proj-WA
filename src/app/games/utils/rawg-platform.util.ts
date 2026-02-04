export type PlatformKey = 'pc' | 'playstation' | 'xbox' | 'switch';

export function mapRawgPlatformToKey(value: string): PlatformKey | null {
    const v = value.toLowerCase();

    if (v.includes('playstation')) return 'playstation';
    if (v.includes('xbox')) return 'xbox';
    if (v.includes('switch') || v.includes('nintendo')) return 'switch';
    if (v.includes('pc') || v.includes('windows')) return 'pc';

    return null;
}
