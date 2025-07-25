import { Tags } from '../Tags';
import icon from './CartelDeManhwas.webp';
import { DecoratableMangaScraper } from '../providers/MangaPlugin';
import * as MangaStream from './decorators/WordPressMangaStream';
import * as Common from './decorators/Common';

@MangaStream.MangaCSS(/^{origin}\/proyectos\/[^/]+\/$/)
@MangaStream.MangasSinglePageCSS(undefined, '/proyectos/list-mode/')
@MangaStream.ChaptersSinglePageCSS()
@MangaStream.PagesSinglePageJS([], 'ts_reader.params.sources.at(0).images')
@Common.ImageAjax()
export default class extends DecoratableMangaScraper {

    public constructor() {
        super('carteldemanhwas', 'Cartel De Manhwas', 'https://carteldemanhwas.net', Tags.Media.Manhwa, Tags.Media.Manhua, Tags.Media.Manga, Tags.Language.Spanish, Tags.Source.Scanlator);
    }

    public override get Icon() {
        return icon;
    }
}