import { browser } from '$app/environment';
import { supabase } from '$lib/supabase/client';
import type { Asset } from '$lib/types';

class AssetStore {
    all = $state<Asset[]>([]);

    constructor() {
        if (browser) {
            this.init();
        }
    }

    async init() {
        const { data } = await supabase.from('assets').select('*');
        if (data) this.all = data;
    }
}

export const assetStore = new AssetStore();
