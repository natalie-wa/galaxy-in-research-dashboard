"""Refresh an explicit OpenAlex institution-location snapshot (network step).

Run only when intentionally refreshing geographic metadata. Normal data/build
commands use the saved snapshot offline. Counts and membership always come from
the fixed publication corpus, not from live institution citation counters.
"""
import argparse
import concurrent.futures
import datetime
import json
import math
import time
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', type=int, default=1000)
    args = parser.parse_args()
    corpus = json.loads((ROOT/'src/data/corpus.json').read_text())
    counts = Counter(i for w in corpus['works'] for i in set(w['institutions']))
    ids = [i for i,n in sorted(counts.items(), key=lambda item: (-item[1],item[0]))[:args.limit]]
    destination = ROOT/'data/institutions'
    raw = destination/'raw'
    raw.mkdir(parents=True, exist_ok=True)
    retrieved = datetime.datetime.now(datetime.timezone.utc).isoformat()
    def fetch(batch):
        params = {'filter':'openalex:'+'|'.join(i.rsplit('/',1)[-1] for i in batch),
                  'per-page':50, 'select':'id,display_name,geo,ror,country_code'}
        url = 'https://api.openalex.org/institutions?'+urllib.parse.urlencode(params)
        for attempt in range(3):
            try:
                req = urllib.request.Request(url,headers={'User-Agent':'Galaxy-in-Research-dashboard/0.3 (institution geography snapshot)'})
                with urllib.request.urlopen(req, timeout=25) as response:
                    result = json.load(response)
                if 'results' not in result: raise ValueError('Missing results in OpenAlex response')
                return {'request_url':url,'requested_ids':batch,'retrieved_at':retrieved,'response':result}
            except Exception:
                if attempt == 2: raise
                time.sleep(attempt+1)
    batches = [ids[i:i+50] for i in range(0,len(ids),50)]
    records = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        futures = {pool.submit(fetch,batch):index for index,batch in enumerate(batches)}
        for future in concurrent.futures.as_completed(futures):
            index = futures[future]
            result = future.result()
            (raw/f'batch_{index:03}.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
            for institution in result['response']['results']:
                records[institution['id']] = institution
            print(f'Fetched institution batch {index+1}/{len(batches)}',flush=True)
    output = []
    missing = []
    for identifier in ids:
        r = records.get(identifier, {})
        geo = r.get('geo') or {}
        lat,lon = geo.get('latitude'),geo.get('longitude')
        if not (isinstance(lat,(int,float)) and isinstance(lon,(int,float)) and math.isfinite(lat) and math.isfinite(lon) and -90<=lat<=90 and -180<=lon<=180):
            missing.append(identifier)
            continue
        output.append(dict(id=identifier,name=r['display_name'],latitude=lat,longitude=lon,
                           city=geo.get('city'),country_code=geo.get('country_code') or r.get('country_code'),
                           ror=r.get('ror'),snapshot_publications=counts[identifier]))
    payload = dict(source='OpenAlex institutions API',retrieved_at=retrieved,
                   selection=f'Top {args.limit} institutions by retained-corpus publication count; ties broken by ID',
                   requested=len(ids),located=len(output),missing_location_ids=missing,institutions=output)
    (destination/'locations.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n')
    print(f'Saved {len(output)} verified institution locations; {len(missing)} without usable coordinates.',flush=True)
