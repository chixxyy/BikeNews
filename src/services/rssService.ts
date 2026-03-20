export interface NewsItem {
  id: string;
  source: string;
  cat: string;
  tags: string[];
  severity: 'critical' | 'high' | 'low';
  timestamp: number;
  headline: string;
  summary: string;
  image: string;
  url: string;
  provider: string;
}

const FEEDS = [
  { name: 'Cyclingnews', url: 'https://www.cyclingnews.com/rss.xml', cat: 'pro' },
  { name: 'Velo', url: 'https://velo.outsideonline.com/feed/', cat: 'pro' },
  { name: 'Pinkbike', url: 'https://www.pinkbike.com/pinkbike_xml_feed.php', cat: 'tech' },
  { name: 'Bikerumor', url: 'https://bikerumor.com/feed/', cat: 'tech' },
  { name: 'road.cc', url: 'https://road.cc/rss', cat: 'tech' },
];

function getCategory(headline: string, defaultCat: string): string {
  const h = headline.toLowerCase();
  const techKeywords = ['review', 'tested', 'shimano', 'sram', 'campagnolo', 'wheel', 'groupset', 'helmet', 'bike', 'gear', 'tech', 'aero', 'watt', 'tire', 'saddle'];
  if (techKeywords.some((kw) => h.includes(kw))) {
    return 'tech';
  }
  return defaultCat;
}

// Priority: 器材 (tech keywords) -> Critical, 重大新聞 (major keywords) -> High, 負面/比賽/一般 -> Low
function getSeverity(headline: string): 'critical' | 'high' | 'low' {
  const h = headline.toLowerCase();
  
  // 1. 器材
  const techKeywords = ['review', 'tested', 'shimano', 'sram', 'campagnolo', 'wheel', 'groupset', 'helmet', 'bike', 'gear', 'tech', 'aero', 'watt', 'tire', 'saddle', 'first look', 'introduce', 'new bike'];
  if (techKeywords.some((kw) => h.includes(kw))) return 'critical';
  
  // 2. 重大新聞
  const majorKeywords = ['tour de france', 'world champ', 'olympic', 'monument', 'roubaix', 'flanders', 'giro', 'vuelta', 'record', 'historic'];
  if (majorKeywords.some((kw) => h.includes(kw))) return 'high';
  
  // 3. 負面事件 / 比賽結果 / 選手職涯 / 其他
  return 'low';
}

// RSS2JSON Response Types
export interface Rss2JsonItem {
  title: string;
  pubDate: string;
  link: string;
  guid: string;
  author: string;
  thumbnail: string;
  description: string;
  content: string;
  enclosure?: { link: string; type: string; length: number };
  categories: string[];
}

export interface Rss2JsonSuccessResponse {
  status: 'ok';
  feed: {
    url: string;
    title: string;
    link: string;
    author: string;
    description: string;
    image: string;
  };
  items: Rss2JsonItem[];
}

export interface Rss2JsonErrorResponse {
  status: 'error';
  message: string;
  [key: string]: any;
}

export type Rss2JsonResponse = Rss2JsonSuccessResponse | Rss2JsonErrorResponse;

export async function fetchBikeNews(): Promise<NewsItem[]> {
  const allItems: NewsItem[] = [];

  const promises = FEEDS.map(async (feed) => {
    try {
      // Use rss2json to bypass CORS and Cloudflare 403 blocks reliably
      const cacheBuster = `&_cb=${Date.now()}`;
      const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}${cacheBuster}`;
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        // Handle non-200 status codes (like 422) by attempting to parse JSON error payload
        try {
          const errorData = await response.json();
          console.error(`[BikeNews] HTTP ${response.status} Error fetching ${feed.name}:`, errorData);
        } catch {
          console.error(`[BikeNews] HTTP ${response.status} Error fetching ${feed.name}. No JSON payload provided.`);
        }
        return; // Skip this feed
      }
      
      const data = await response.json() as Rss2JsonResponse;
      if (data.status !== 'ok') {
        console.error(`[BikeNews] RSS2JSON API Error for ${feed.name}:`, data);
        return;
      }
      
      if (!data.items || !Array.isArray(data.items)) {
        return;
      }

      data.items.forEach((item: Rss2JsonItem) => {
        const headline = item.title || '';
        const summaryRaw = item.description || item.content || '';
        
        let image = item.thumbnail || item.enclosure?.link || '';
        if (!image) {
          const imgMatch = summaryRaw.match(/<img[^>]+src="([^">]+)"/);
          if (imgMatch) image = imgMatch[1];
        }
        
        const summary = summaryRaw.replace(/<[^>]*>?/gm, '').slice(0, 300);
        const url = item.link || '#';
        const timestamp = item.pubDate ? new Date(item.pubDate.replace(/-/g, '/')).getTime() : Date.now();
        const id = item.guid || url;
        const assignedCat = getCategory(headline, feed.cat);

        allItems.push({
          id: `${feed.name}-${id}`,
          source: feed.name,
          cat: assignedCat,
          tags: [assignedCat],
          severity: getSeverity(headline),
          timestamp,
          headline,
          summary,
          image,
          url,
          provider: 'rss',
        });
      });
    } catch (error) {
      // Silently handle fetch failures so the browser console stays clean
      console.warn(`[BikeNews] Skip ${feed.name}: Connection/Network error`);
    }
  });

  await Promise.all(promises);
  return allItems.sort((a, b) => b.timestamp - a.timestamp);
}
