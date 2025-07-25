﻿import { TestFixture } from '../../../test/WebsitesFixture';

new TestFixture({
    plugin: {
        id: 'opiatoon',
        title: 'Opiatoon (Opia&Shipperland)'
    },
    container: {
        url: 'https://opiatoon.lol/manga/lit-a-light/',
        id: JSON.stringify({ post: '20752', slug: '/manga/lit-a-light/' }),
        title: 'Lit a Light'
    },
    child: {
        id: '/manga/lit-a-light/bolum-1-one-shot/',
        title: 'Bölüm 1 - One Shot'
    },
    entry: {
        index: 0,
        size: 600_410,
        type: 'image/jpeg'
    }
}).AssertWebsite();