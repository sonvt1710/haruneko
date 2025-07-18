// @vitest-environment jsdom
import { mock } from 'vitest-mock-extended';
import { describe, it, expect } from 'vitest';
import type { HakuNeko } from '../../engine/HakuNeko';
import type { Choice, ISettings, SettingsManager } from '../SettingsManager';
import * as testee from './BookmarkConverter';
import { LocaleID } from '../../i18n/ILocale';
import { Key } from '../SettingsGlobal';
import { GetLocale } from '../../i18n/Localization';

const legacyWebsiteIdentifierMapTestCases = [
    { sourceID: 'apolltoons', targetID: 'mundomanhwa' },
    { sourceID: 'azoramanga', targetID: 'azoraworld' },
    { sourceID: 'bacamangaorg', targetID: 'bacamanga' },
    { sourceID: 'bananascan', targetID: 'harmonyscan' },
    { sourceID: 'cocomanhua', targetID: 'colamanga' },
    { sourceID: 'comicbushi', targetID: 'comicgrowl' },
    { sourceID: 'comicwalker', targetID: 'kadocomi' },
    { sourceID: 'firescans', targetID: 'firecomics' },
    { sourceID: 'firstkiss', targetID: 'likemanga' },
    { sourceID: 'flamescans-org', targetID: 'flamecomics' },
    { sourceID: 'galaxyaction', targetID: 'galaxymanga' },
    { sourceID: 'gateanimemanga', targetID: 'gatemanga' },
    { sourceID: 'imperioscans', targetID: 'neroxus' },
    { sourceID: 'instamanhwa', targetID: 'xmanhwa' },
    { sourceID: 'kissaway', targetID: 'klmanga' },
    { sourceID: 'kisscomic', targetID: 'readcomiconline' },
    { sourceID: 'komikav', targetID: 'apkomik' },
    { sourceID: 'kumascans', targetID: 'retsu' },
    { sourceID: 'lovehug', targetID: 'welovemanga' },
    { sourceID: 'lyrascans', targetID: 'quantumscans' },
    { sourceID: 'mangacross', targetID: 'championcross'},
    { sourceID: 'mangamx', targetID: 'mangaoni' },
    { sourceID: 'manganel', targetID: 'manganato' },
    { sourceID: 'mangaproz', targetID: 'mangapro' },
    { sourceID: 'mangaraw', targetID: 'mangageko' },
    { sourceID: 'mangatale', targetID: 'ikiru' },
    { sourceID: 'manhuascan', targetID: 'kaliscan' },
    { sourceID: 'nitroscans', targetID: 'nitromanga' },
    { sourceID: 'neteasecomic', targetID: 'bilibilimanhua'},
    { sourceID: 'prismascans', targetID: 'demonsect' },
    { sourceID: 'reaperscansid', targetID: 'shinigamiid' },
    { sourceID: 'scanhentaimenu', targetID: 'xmanga' },
    { sourceID: 'shonenmagazine-pocket', targetID: 'shonenmagazine' },
    { sourceID: 'siyahmelek', targetID: 'grimelek' },
    { sourceID: 'suryatoon', targetID: 'genztoon' },
    { sourceID: 'sushiscanfr', targetID: 'animesama' },
    { sourceID: 'vermanhwas', targetID: 'vermanhwa' },
    { sourceID: 'visualikigai', targetID: 'ikigaimangas' },
    { sourceID: 'webtoontrcom', targetID: 'webtoontrnet' },
];

// Mocking globals
{
    const mockChoice = mock<Choice>({ Value: LocaleID.Locale_enUS });

    const mockSettigns = mock<ISettings>();
    mockSettigns.Get.calledWith(Key.Language).mockReturnValue(mockChoice);

    const mockSettingsManager = mock<SettingsManager>();
    mockSettingsManager.OpenScope.mockReturnValue(mockSettigns);

    window.HakuNeko = mock<HakuNeko>({ SettingsManager: mockSettingsManager });
}

describe('BookmarkConverter', () => {

    describe('ConvertToSerializedBookmark()', () => {

        it.each<unknown>([
            ['x', 1], { x: 1 }, null, true, 'x', 1
        ])('Should throw for invald data', async (data) => {
            const expected = GetLocale(LocaleID.Locale_enUS).BookmarkPlugin_ConvertToSerializedBookmark_UnsupportedFormatError();
            expect(() => testee.ConvertToSerializedBookmark(data)).toThrowError(expected);
        });

        it('Should keep serialized bookmark', async () => {
            const expected = {
                Created: 123456789,
                Updated: 987654321,
                Title: 'media-title',
                Media: { ProviderID: 'website-key', EntryID: 'media-key' },
                Info: { ProviderID: 'tracker-key', EntryID: 'item-key' }
            };
            const actual = testee.ConvertToSerializedBookmark(expected);
            expect(actual).toBe(expected);
        });

        it('Should convert legacy bookmark', async () => {
            const expected = {
                Created: 0,
                Updated: 0,
                Title: 'manga-title',
                Media: { ProviderID: 'website-key', EntryID: 'manga-key' },
                Info: { ProviderID: null, EntryID: null }
            };
            const actual = testee.ConvertToSerializedBookmark({
                key: { connector: 'website-key', manga: 'manga-key' },
                title: { connector: 'website-title', manga: 'manga-title' },
            });
            expect(actual).toStrictEqual(expected);
        });

        it('Should have expected number of legacy mappings', async () => {
            expect(testee.legacyWebsiteIdentifierMap.size).toBe(legacyWebsiteIdentifierMapTestCases.length);
        });

        it.each(legacyWebsiteIdentifierMapTestCases)('Should migrate website ID from legacy bookmark', async (data) => {
            const actual = testee.ConvertToSerializedBookmark({
                key: { connector: data.sourceID, manga: 'manga-key' },
                title: { connector: 'website-title', manga: 'manga-title' },
            });
            expect(actual.Media.ProviderID).toStrictEqual(data.targetID);
        });
    });
});