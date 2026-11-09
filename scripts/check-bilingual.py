"""Validate the generated language routes, discovery, search indexes and images."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json
import xml.etree.ElementTree as ET

root=Path(__file__).resolve().parents[1]/'_site'
class Page(HTMLParser):
    def __init__(self,path):
        super().__init__();self.links=[];self.images=[];self.alternates={};self.canonical=None;self.lang=None;self.h1=0;self.jsonld=False;self.buffer='';self.noindex=False;self.article=False;self.structured=[]
        self.feed(path.read_text(encoding='utf-8'))
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='html':self.lang=a.get('lang')
        if tag=='h1':self.h1+=1
        if tag in ('a','link') and a.get('href'):self.links.append(a['href'])
        if tag=='img':self.images.append(a)
        if tag=='link' and a.get('rel')=='canonical':self.canonical=a.get('href')
        if tag=='link' and a.get('hreflang'):self.alternates[a['hreflang']]=a['href']
        if tag=='script' and a.get('type')=='application/ld+json':self.jsonld=True;self.buffer=''
        if tag=='meta' and a.get('name')=='robots':self.noindex='noindex' in a.get('content','')
        if tag=='meta' and a.get('property')=='og:type':self.article=a.get('content')=='article'
    def handle_data(self,text):
        if self.jsonld:self.buffer+=text
    def handle_endtag(self,tag):
        if tag=='script' and self.jsonld:self.structured.append(json.loads(self.buffer));self.jsonld=False

pages={('/'+p.relative_to(root).as_posix().removesuffix('index.html')):Page(p) for p in root.rglob('*.html') if 'admin' not in p.parts and p.name!='404.html'}
for url,p in pages.items():
    assert p.h1==1,(url,'one H1',p.h1)
    assert p.lang==('en' if url.startswith('/en/') else 'tr'),(url,'language')
    assert p.canonical=='https://sezginmesut.com'+url,(url,'canonical')
    assert set(p.alternates)=={'tr','en','x-default'},(url,'language pair',p.alternates)
    for lang,href in p.alternates.items():
        target=urlsplit(href).path
        assert target in pages,(url,'missing translation',target)
        assert pages[target].alternates==p.alternates,(url,'nonreciprocal pair',target)
    for href in p.links:
        target=urlsplit(href)
        if target.scheme in ('mailto','tel') or target.netloc not in ('','sezginmesut.com') or not target.path.startswith('/'):continue
        path=unquote(target.path)
        assert path in pages or (root/path.lstrip('/')).exists(),(url,'missing internal link',path)
    for image in p.images:
        path=urlsplit(image.get('src','')).path
        if image.get('src','').startswith('/'):
            assert (root/path.lstrip('/')).is_file(),(url,'missing image',path)

ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
listed=[urlsplit(e.text).path for e in ET.parse(root/'sitemap.xml').findall('s:url/s:loc',ns)]
assert len(listed)==len(set(listed)),'Duplicate sitemap URLs'
for url in listed:assert url in pages and not pages[url].noindex,(url,'sitemap')
for url,p in pages.items():
    if not p.noindex:assert url in listed,(url,'absent from sitemap')
for language,prefix in [('tr',''),('en','/en')]:
    index=json.loads((root/(prefix.lstrip('/')+'/search-index.json').lstrip('/')).read_text(encoding='utf-8'))
    expected={url for url,page in pages.items() if page.lang==language and page.article}
    assert {item['url'] for item in index if not item['video']}==expected,(language,'published articles in search index')
    for item in index:
        if item['video']:assert item['url'].startswith('https://www.youtube.com/'),item
        else:assert item['url'] in pages and pages[item['url']].lang==language,item
        assert item['title'] and item['description'] and item['categoryName'],item
    homepage=(root/(prefix.lstrip('/')+'/index.html').lstrip('/')).read_text(encoding='utf-8')
    assert homepage.count('class="home-latest"')==3,(language,'latest article cards')
    assert homepage.count('src="/gorseller/sezgin-mesut-transparent.png"')==1,(language,'logo')

source=root.parent/'src'
profile_links=json.loads((source/'_data/profile.json').read_text(encoding='utf-8'))['links']
same_as=[link['url'] for link in profile_links]
assert json.loads((source/'_data/site.json').read_text(encoding='utf-8'))['sameAs']==same_as,'Person identity matches visible personal profiles'
for url in ['/hakkimda/','/en/about/']:
    page=pages[url]
    nodes=[node for block in page.structured for node in block.get('@graph',[])]
    profile=next(node for node in nodes if node.get('@type')=='ProfilePage')
    person=profile['mainEntity']
    assert profile['url']=='https://sezginmesut.com'+url
    assert person['@type']=='Person' and person['name']=='Sezgin Mesut'
    assert person['@id']=='https://sezginmesut.com/#person'
    assert person['sameAs']==same_as
    assert all(link in page.links for link in same_as),'Schema profiles must be visible on the page'
    assert url in listed,'Profile page is discoverable through sitemap'

print(f'PASS: {len(pages)} pages; language pairs, canonical URLs, links, images, sitemap, search indexes, homepage thumbnails and ProfilePage identity.')
