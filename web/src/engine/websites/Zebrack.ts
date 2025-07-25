﻿import { Tags } from '../Tags';
import icon from './Zebrack.webp';
import { Chapter, DecoratableMangaScraper, Manga, Page, type MangaPlugin } from '../providers/MangaPlugin';
import * as Common from './decorators/Common';
import protoTypes from './Zebrack.proto?raw';
import { FetchProto, FetchWindowScript } from '../platform/FetchProvider';
import type { Priority } from '../taskpool/TaskPool';
import { Exception } from '../Error';
import { WebsiteResourceKey as R } from '../../i18n/ILocale';

type ZebrackResponse = {
    titleDetailView: TitleDetailView,
    magazineViewerView: MagazineViewerView,
    volumeListView: VolumeListView;
};

type VolumeListView = {
    volumes: Volume[];
};

type Volume = {
    titleId: number,
    volumeId: number,
    titleName: string,
    volumeName: string;
};

type TitleDetailView = {
    titleId: number,
    titleName: string;
};

type TitleChapterListViewV3 = {
    titleId: number,
    groups: ChapterGroupV3[],
    titleName: string;
};

type ChapterGroupV3 = {
    volumeId: number,
    chapters: ChapterV3[];
};

type ChapterV3 = {
    id: number,
    titleId: number,
    mainName: string;
};

type MagazineViewerView = {
    images: ZebrackImage[];
};

type ZebrackImage = {
    imageUrl: string,
    encryptionKey: string;
};

type ChapterViewerViewV3 = {
    pages: ChapterPageV3[];
};
type ChapterPageV3 = {
    image: ImageV3;
};

type ImageV3 = {
    imageUrl: string,
    encryptionKey: string;
};

type GravureDetailViewV3 = {
    gravure: GravureV3;
};

type GravureV3 = {
    name: string;
};

type GravureViewerViewV3 = {
    images: ImageV3[];
};

type MagazineDetailViewV3 = {
    magazine: MagazineIssue;
};
type MagazineIssue = {
    magazineName: string,
    issueName: string;
};

type VolumeViewerViewV3 = {
    pages: VolumePageV3[];
};

type VolumePageV3 = {
    image: ImageV3;
};

type PageParam = {
    encryptionKey: string;
};

// TODO: Check for possible revision

@Common.MangasNotSupported()
export default class extends DecoratableMangaScraper {

    private readonly apiURL = 'https://api2.zebrack-comic.com';
    private readonly oldApiUrl = 'https://api.zebrack-comic.com';
    private readonly responseRootType = 'Zebrack.Response';

    public constructor () {
        super('zebrack', 'Zebrack(ゼブラック)', 'https://zebrack-comic.shueisha.co.jp', Tags.Media.Manga, Tags.Language.Japanese, Tags.Source.Official);
    }

    public override get Icon() {
        return icon;
    }

    public override ValidateMangaURL(url: string): boolean {
        return new RegExpSafe(`^${this.URI.origin}/(title|gravure|magazine)/\\d+(/(issue|volume|volume_list)/\\d+)?`).test(url);
    }

    public override async FetchManga(provider: MangaPlugin, url: string): Promise<Manga> {
        const uri = new URL(url);
        if (/^\/magazine\//.test(uri.pathname)) {
            const magazineId = uri.pathname.match(/\/magazine\/(\d+)/).at(-1);
            const magazineIssueId = uri.pathname.match(/\/issue\/(\d+)/).at(-1);
            const { magazine: { magazineName, issueName } } = await this.FetchMagazineDetail(magazineId, magazineIssueId);
            return new Manga(this, provider, uri.pathname, `${magazineName} ${issueName}`);

        } else if (/^\/gravure\//.test(uri.pathname)) {
            const gravureId = uri.pathname.match(/\/gravure\/(\d+)$/).at(-1);
            const { gravure: { name } } = await this.FetchGravureDetail(gravureId);
            return new Manga(this, provider, uri.pathname, name.trim());
        }

        const titleId = uri.pathname.match(/\/title\/(\d+)/).at(-1);
        const { titleDetailView: { titleName } } = await this.FetchTitleDetail(titleId);
        return new Manga(this, provider, uri.pathname, titleName.trim());

    }

    private async FetchMagazineDetail(magazineId: string, magazineIssueId: string): Promise<MagazineDetailViewV3> {
        const uri = new URL('/api/v3/magazine_issue_detail', this.oldApiUrl);
        uri.searchParams.set('os', 'browser');
        uri.searchParams.set('magazine_id', magazineId);
        uri.searchParams.set('magazine_issue_id', magazineIssueId);
        return FetchProto<MagazineDetailViewV3>(new Request(uri), protoTypes, 'Zebrack.MagazineDetailViewV3');
    }

    private async FetchGravureDetail(gravureId: string): Promise<GravureDetailViewV3> {
        const uri = new URL('/api/v3/gravure_detail', this.apiURL);
        uri.searchParams.set('os', 'browser');
        uri.searchParams.set('gravure_id', gravureId);
        return FetchProto<GravureDetailViewV3>(new Request(uri), protoTypes, 'Zebrack.GravureDetailViewV3');
    }

    private async FetchTitleDetail(titleId: string): Promise<ZebrackResponse> {
        const uri = new URL('/api/browser/title_detail', this.apiURL);
        uri.searchParams.set('os', 'browser');
        uri.searchParams.set('title_id', titleId);
        return FetchProto<ZebrackResponse>(new Request(uri), protoTypes, this.responseRootType);
    }

    public override async FetchChapters(manga: Manga): Promise<Chapter[]> {
        const [ , path1, path2, path3, path4 ] = manga.Identifier.split('/');
        let type = path3 || 'chapter';
        if ([ 'magazine', 'gravure' ].includes(path1)) {
            type = path1;
        }
        if (type === 'chapter') {
            const id = path2;
            const { groups } = await this.FetchChapterList(id);
            return groups.reduce((chaptersAccumulator: Chapter[], currentGroup) => {
                const chapters = currentGroup.chapters.map(chapter => new Chapter(this, manga, `chapter/${chapter.titleId}/${chapter.id}`, chapter.mainName.replace(manga.Title, '').trim()));
                chaptersAccumulator.push(...chapters);
                return chaptersAccumulator;
            }, []);
        }

        if (type === 'gravure') {
            return [ new Chapter(this, manga, manga.Identifier.slice(1), manga.Title) ];
        }

        if (type === 'magazine') {
            const magazineId = path2;
            const magazineIssueId = path4;
            return [ new Chapter(this, manga, `magazine/${magazineId}/${magazineIssueId}`, manga.Title) ];
        }

        if (type === 'volume_list' || type === 'volume') {
            const id = path2;
            const { volumeListView: { volumes } } = await this.FetchVolumeList(id);
            return volumes.map(volume => new Chapter(this, manga, `volume/${volume.titleId}/${volume.volumeId}`, volume.volumeName.replace(manga.Title, '').trim()));
        }
        return [];
    }

    private async FetchVolumeList(id: string): Promise<ZebrackResponse> {
        const uri = new URL('/api/browser/title_volume_list', this.apiURL);
        uri.searchParams.set('os', 'browser');
        uri.searchParams.set('title_id', id);
        return FetchProto<ZebrackResponse>(new Request(uri), protoTypes, this.responseRootType);
    }

    private async FetchChapterList(id: string): Promise<TitleChapterListViewV3> {
        const uri = new URL('/api/v3/title_chapter_list', this.apiURL);
        uri.searchParams.set('os', 'browser');
        uri.searchParams.set('title_id', id);
        return FetchProto<TitleChapterListViewV3>(new Request(uri), protoTypes, 'Zebrack.TitleChapterListViewV3');
    }

    public override async FetchPages(chapter: Chapter): Promise<Page[]> {
        const [ type, titleId, chapterId ] = chapter.Identifier.split('/');
        const secretKey = await FetchWindowScript<string>(new Request(this.URI), `localStorage.getItem('device_secret_key') || ''`);

        if (type === 'chapter') {
            const { pages } = await this.FetchChapterViewer(titleId, chapterId, secretKey);
            if (pages) {
                return pages
                    .filter(page => page.image && page.image.imageUrl)
                    .map(page => new Page<PageParam>(this, chapter, new URL(page.image.imageUrl), { encryptionKey: page.image.encryptionKey }));
            }
        }

        if (type === 'gravure') {
            const { images } = await this.FetchGravureViewer(titleId, secretKey);
            if (images) {
                return images.map(image => new Page<PageParam>(this, chapter, new URL(image.imageUrl), { encryptionKey: image.encryptionKey }));
            }
        }

        if (type === 'magazine') {
            const { magazineViewerView } = await this.FetchMagazineViewer(titleId, chapterId, secretKey);
            if (magazineViewerView) {
                return magazineViewerView.images
                    .filter(image => image && image.imageUrl)
                    .map(image => new Page<PageParam>(this, chapter, new URL(image.imageUrl), { encryptionKey: image.encryptionKey }));
            }
        }

        if (type === 'volume') {
            const { pages } = await this.FetchVolumeViewer(titleId, chapterId, secretKey);
            if (pages) {
                return pages
                    .filter(page => page.image && page.image.imageUrl)
                    .map(page => new Page<PageParam>(this, chapter, new URL(page.image.imageUrl), { encryptionKey: page.image.encryptionKey }));
            }
        }

        throw new Exception(R.Plugin_Common_Chapter_InvalidError);
    }

    private async FetchVolumeViewer(titleId: string, volumeId: string, secretKey: string) {
        const uri = new URL('/api/v3/manga_volume_viewer', this.apiURL);
        uri.searchParams.set('secret', secretKey);
        uri.searchParams.set('is_trial', '0');
        uri.searchParams.set('os', 'browser');
        uri.searchParams.set('title_id', titleId);
        uri.searchParams.set('volume_id', volumeId);
        let data = await FetchProto<VolumeViewerViewV3>(new Request(uri), protoTypes, 'Zebrack.VolumeViewerViewV3');
        if (!data.pages) {
            uri.searchParams.set('is_trial', '1');
            data = await FetchProto<VolumeViewerViewV3>(new Request(uri), protoTypes, 'Zebrack.VolumeViewerViewV3');
        }
        return data;
    }

    private async FetchMagazineViewer(magazineId: string, magazineIssueId: string, secretKey: string): Promise<ZebrackResponse> {
        const uri = new URL('/api/browser/magazine_viewer', this.oldApiUrl);
        uri.searchParams.set('secret', secretKey);
        uri.searchParams.set('is_trial', '0');
        uri.searchParams.set('os', 'browser');
        uri.searchParams.set('magazine_id', magazineId);
        uri.searchParams.set('magazine_issue_id', magazineIssueId);
        let data = await FetchProto<ZebrackResponse>(new Request(uri), protoTypes, this.responseRootType);
        if (!data.magazineViewerView) {
            uri.searchParams.set('is_trial', '1');
            data = await FetchProto<ZebrackResponse>(new Request(uri), protoTypes, this.responseRootType);
        }
        return data;
    }

    private async FetchGravureViewer(gravureId: string, secretKey: string): Promise<GravureViewerViewV3> {
        const uri = new URL('/api/v3/gravure_viewer', this.apiURL);
        uri.searchParams.set('secret', secretKey);
        uri.searchParams.set('is_trial', '0');
        uri.searchParams.set('os', 'browser');
        uri.searchParams.set('gravure_id', gravureId);
        let data = await FetchProto<GravureViewerViewV3>(new Request(uri), protoTypes, 'Zebrack.GravureViewerViewV3');
        if (!data.images) {
            uri.searchParams.set('is_trial', '1');
            data = await FetchProto<GravureViewerViewV3>(new Request(uri), protoTypes, 'Zebrack.GravureViewerViewV3');
        }
        return data;
    }

    private async FetchChapterViewer(titleId: string, chapterId: string, secretKey: string): Promise<ChapterViewerViewV3> {
        const uri = new URL('/api/v3/chapter_viewer', this.apiURL);
        const params = new URLSearchParams();
        params.set('secret', secretKey);
        params.set('os', 'browser');
        params.set('title_id', titleId);
        params.set('chapter_id', chapterId);
        params.set('type', 'normal');
        const request = new Request(uri, {
            method: 'POST',
            body: params.toString(),
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            }
        });
        return FetchProto<ChapterViewerViewV3>(request, protoTypes, 'Zebrack.ChapterViewerViewV3');
    }

    public override async FetchImage(page: Page<PageParam>, priority: Priority, signal: AbortSignal): Promise<Blob> {
        const blob = await Common.FetchImageAjax.call(this, page, priority, signal);
        if (!page.Parameters.encryptionKey) return blob;
        const encrypted = await new Response(blob).arrayBuffer();
        const decrypted = XORDecrypt(new Uint8Array(encrypted), page.Parameters.encryptionKey);
        return new Blob([ decrypted ], { type: blob.type });
    }
}

function XORDecrypt(encrypted: Uint8Array, key: string) {
    if (key) {
        const t = new Uint8Array(key.match(/.{1,2}/g).map(e => parseInt(e, 16)));
        const s = new Uint8Array(encrypted);
        for (let n = 0; n < s.length; n++) {
            s[ n ] ^= t[ n % t.length ];
        }
        return s;
    } else {
        return encrypted;
    }
}