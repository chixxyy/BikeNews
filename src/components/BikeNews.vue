<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { fetchBikeNews, type NewsItem } from '../services/rssService'
import { BarChart3, Zap, Search, Globe, Languages, Bike, Trophy, Timer, Flag, MousePointer2, Sun, Moon, Menu } from 'lucide-vue-next'
import { useDark, useToggle } from '@vueuse/core'

const isDark = useDark()
const toggleTheme = useToggle(isDark)
const isMenuOpen = ref(false)

const newsItems = ref<NewsItem[]>([])
const isLoading = ref(true)
const totalFetched = ref(0)
let refreshInterval: any
const filterTabs = [
  { label: '全部', tag: '' },
  { label: '賽事', tag: 'pro' },
  { label: '器材', tag: 'tech' },
]
const severityFilters = ['器材技術', '重大焦點', '一般動態']
const activeFilter = ref({ label: '全部', tag: '' })
const activeSeverity = ref<string[]>([])
const searchQuery = ref('')

function getRelativeTime(timestamp: number) {
  const mins = Math.floor((Date.now() - timestamp) / 60000)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

function getAccentColor(severity: string) {
  if (severity === '器材技術') return 'bg-red-500'
  if (severity === '重大焦點') return 'bg-orange-500'
  if (severity === '一般動態') return 'bg-slate-500'
  return 'bg-slate-500'
}

function getTabStyle(tab: { tag: string }, isActive: boolean, isDark: boolean) {
  if (!isActive) {
    return isDark ? 'text-slate-500 hover:text-slate-300 hover:bg-white/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
  }
  if (tab.tag === '') return 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
  if (tab.tag === 'pro') return 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
  if (tab.tag === 'tech') return 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
  return ''
}

function getCategoryStyle(cat: string, isDark: boolean) {
  if (cat === 'pro') {
    return isDark ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' : 'bg-yellow-100 border-yellow-200 text-yellow-700'
  }
  if (cat === 'tech') {
    return isDark ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-cyan-100 border-cyan-300 text-cyan-700'
  }
  return isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-100 border-indigo-300 text-indigo-700'
}

async function loadNews() {
  try {
    const items = await fetchBikeNews()
    newsItems.value = items
    totalFetched.value = items.length
  } catch (e) {
    console.warn('[BikeNews] Refresh cycle encountered a warning', e)
  } finally {
    isLoading.value = false
  }
}

const filteredNews = computed(() => {
  return newsItems.value.filter(item => {
    if (activeFilter.value.tag && item.cat !== activeFilter.value.tag) return false
    if (activeSeverity.value.length && !activeSeverity.value.map(s => s.toLowerCase()).includes(item.severity)) return false
    if (searchQuery.value && !item.headline.toLowerCase().includes(searchQuery.value.toLowerCase())) return false
    return true
  })
})

function toggleSeverity(s: string) {
  const i = activeSeverity.value.indexOf(s)
  if (i === -1) activeSeverity.value.push(s)
  else activeSeverity.value.splice(i, 1)
}

// Translation logic (mimicking TradingBox)
const translationCache = new Map<string, { headline: string; summary: string }>()
const translatingIds = ref<Set<string>>(new Set())
const translatedIds = ref<Set<string>>(new Set())

async function translateText(text: string): Promise<string> {
  if (!text) return ''
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh-TW`)
    const data = await res.json()
    return data.responseData?.translatedText || text
  } catch {
    return text
  }
}

async function toggleTranslate(item: NewsItem) {
  if (translatedIds.value.has(item.id)) {
    translatedIds.value.delete(item.id)
    return
  }
  if (translationCache.has(item.id)) {
    translatedIds.value.add(item.id)
    return
  }
  
  translatingIds.value.add(item.id)
  try {
    const [headline, summary] = await Promise.all([
      translateText(item.headline),
      item.summary ? translateText(item.summary.slice(0, 400)) : Promise.resolve('')
    ])
    translationCache.set(item.id, { headline, summary })
    translatedIds.value.add(item.id)
  } finally {
    translatingIds.value.delete(item.id)
  }
}

function getDisplayItem(item: NewsItem) {
  if (translatedIds.value.has(item.id) && translationCache.has(item.id)) {
    const t = translationCache.get(item.id)!
    return { ...item, headline: t.headline, summary: t.summary, isTranslated: true }
  }
  return { ...item, isTranslated: false }
}

onMounted(() => {
  loadNews()
  refreshInterval = setInterval(loadNews, 60_000)
})
onUnmounted(() => clearInterval(refreshInterval))
</script>

<template>
  <div 
    class="flex flex-col h-screen w-full transition-colors duration-300 overflow-hidden font-sans"
    :class="isDark ? 'bg-[#05080f] text-slate-300' : 'bg-slate-50 text-slate-900'"
  >
    
    <!-- Stats Header -->
    <div 
      class="h-auto md:h-20 border-b flex flex-col md:flex-row items-stretch md:items-center px-4 md:px-8 py-3 md:py-0 space-y-3 md:space-y-0 md:space-x-6 shrink-0 relative overflow-hidden transition-colors"
      :class="isDark ? 'bg-[#0a0f1c]/90 border-yellow-500/20 backdrop-blur-xl' : 'bg-white border-slate-200 shadow-sm'"
    >
      
      <!-- Logo/Brand for Mobile -->
      <div class="flex items-center justify-between md:hidden">
        <div class="flex items-center space-x-2">
          <Bike class="w-6 h-6 text-yellow-500" />
          <span class="font-black italic text-xl tracking-tighter" :class="isDark ? 'text-white' : 'text-slate-900'">BIKENEWS</span>
        </div>
        <div class="flex items-center space-x-2">
          <button @click="toggleTheme()" class="p-2 rounded-lg hover:bg-slate-200 transition-colors" :class="isDark ? 'text-yellow-500 hover:bg-white/5' : 'text-slate-600'">
            <Sun v-if="isDark" class="w-5 h-5" />
            <Moon v-else class="w-5 h-5" />
          </button>
          <button @click="isMenuOpen = !isMenuOpen" class="p-2 rounded-lg hover:bg-slate-200 transition-colors" :class="isDark ? 'text-slate-400 hover:bg-white/5' : 'text-slate-600'">
            <Menu class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 md:flex md:items-center gap-2 md:gap-x-6 w-full" :class="{'hidden md:flex': !isMenuOpen}">
        <div 
          class="flex items-center space-x-3 md:space-x-4 border rounded-xl px-3 md:px-4 py-2 md:py-2.5 shadow-lg"
          :class="isDark ? 'bg-[#111827] border-slate-800 shadow-black/20' : 'bg-slate-100 border-slate-200 shadow-slate-200/50'"
        >
          <div class="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500">
            <Bike class="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div>
            <div class="text-[9px] md:text-[10px] text-slate-500 font-mono tracking-widest uppercase font-bold">最新</div>
            <div class="font-black text-lg md:text-xl leading-none italic" :class="isDark ? 'text-white' : 'text-slate-900'">{{ totalFetched }}</div>
          </div>
        </div>

        <div 
          class="flex items-center space-x-3 md:space-x-4 border rounded-xl px-3 md:px-4 py-2 md:py-2.5 shadow-lg"
          :class="isDark ? 'bg-[#111827] border-slate-800 shadow-black/20' : 'bg-slate-100 border-slate-200 shadow-slate-200/50'"
        >
          <div class="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
            <Trophy class="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div>
            <div class="text-[9px] md:text-[10px] text-slate-500 font-mono tracking-widest uppercase font-bold">篩選</div>
            <div class="font-black text-lg md:text-xl leading-none italic" :class="isDark ? 'text-white' : 'text-slate-900'">{{ filteredNews.length }}</div>
          </div>
        </div>

        <a 
          v-if="filteredNews.length > 0"
          :href="filteredNews[0].url"
          target="_blank"
          class="hidden lg:flex items-center space-x-4 border rounded-xl px-4 py-2.5 min-w-[240px] cursor-pointer hover:bg-slate-800/80 transition-all group relative overflow-hidden shadow-lg"
          :class="isDark ? 'bg-[#111827] border-slate-800 shadow-black/20' : 'bg-slate-100 border-slate-200 shadow-slate-200/50'"
        >
          <div class="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 group-hover:bg-rose-500/20 transition-colors shrink-0">
            <Timer class="w-5 h-5" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-[10px] text-slate-500 font-mono tracking-widest uppercase font-bold">最新戰報</div>
            <div class="font-bold text-sm leading-snug truncate group-hover:text-yellow-400 transition-colors" :class="isDark ? 'text-white' : 'text-slate-900'">
              {{ filteredNews[0].headline }}
            </div>
          </div>
        </a>

        <div 
          v-else
          class="hidden lg:flex items-center space-x-4 border rounded-xl px-4 py-2.5 min-w-[240px] transition-all group relative overflow-hidden shadow-lg"
          :class="isDark ? 'bg-[#111827] border-slate-800 shadow-black/20' : 'bg-slate-100 border-slate-200 shadow-slate-200/50'"
        >
          <div class="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
            <Timer class="w-5 h-5" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-[10px] text-slate-500 font-mono tracking-widest uppercase font-bold">最新戰報</div>
            <div class="font-bold text-sm leading-snug truncate" :class="isDark ? 'text-white' : 'text-slate-900'">
              進入補給站...
            </div>
          </div>
        </div>

        <!-- Desktop Theme Toggle -->
        <button 
          @click="toggleTheme()" 
          class="hidden md:flex ml-auto items-center justify-center w-10 h-10 rounded-xl border transition-all shadow-lg"
          :class="isDark ? 'bg-[#111827] border-slate-800 text-yellow-500 hover:bg-white/5' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'"
        >
          <Sun v-if="isDark" class="w-5 h-5" />
          <Moon v-else class="w-5 h-5" />
        </button>

        <div 
          class="hidden md:flex items-center space-x-3 border rounded-lg px-5 py-2.5 shadow-lg"
          :class="isDark ? 'bg-yellow-500/10 border-yellow-500/30 shadow-yellow-500/5' : 'bg-yellow-500/10 border-yellow-500/50 shadow-yellow-500/10'"
        >
          <div class="flex space-x-1">
            <span class="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-[pulse_1s_infinite]"></span>
            <span class="w-1.5 h-1.5 rounded-full bg-yellow-500/60 animate-[pulse_1s_infinite_200ms]"></span>
            <span class="w-1.5 h-1.5 rounded-full bg-yellow-500/30 animate-[pulse_1s_infinite_400ms]"></span>
          </div>
          <span class="text-yellow-500 font-black text-[12px] tracking-widest italic uppercase">Real Time</span>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div 
      class="border-b flex flex-wrap items-center gap-2 px-4 md:px-8 py-2 shrink-0 transition-colors"
      :class="isDark ? 'bg-[#05080f] border-slate-800/40' : 'bg-slate-50 border-slate-200'"
    >
      <!-- Category tabs -->
      <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        <button
          v-for="tab in filterTabs"
          :key="tab.tag"
          @click="activeFilter = tab"
          class="h-8 px-4 rounded-lg text-[12px] font-black transition-all whitespace-nowrap shrink-0 flex items-center space-x-1.5 italic uppercase tracking-wider"
          :class="getTabStyle(tab, activeFilter.tag === tab.tag, isDark)"
        >
          <BarChart3 v-if="tab.tag === ''" class="w-3 h-3" />
          <Flag v-else-if="tab.tag === 'pro'" class="w-3 h-3" />
          <Zap v-else class="w-3 h-3" />
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <!-- Divider -->
      <div class="w-px h-5 shrink-0" :class="isDark ? 'bg-slate-700' : 'bg-slate-300'"></div>

      <!-- Severity chips -->
      <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        <button
          v-for="s in severityFilters"
          :key="s"
          @click="toggleSeverity(s)"
          class="text-[10px] font-black px-3 py-1.5 rounded-full border-2 transition-all uppercase tracking-widest italic whitespace-nowrap shrink-0"
          :class="{
            'bg-red-500 border-red-400 text-white shadow-lg': s === '器材技術' && activeSeverity.includes(s),
            'bg-orange-500 border-orange-400 text-white shadow-lg': s === '重大焦點' && activeSeverity.includes(s),
            'bg-slate-700 border-slate-600 text-white shadow-lg': s === '一般動態' && activeSeverity.includes(s),
            'border-slate-300 text-slate-400 hover:border-slate-500': !activeSeverity.includes(s) && !isDark,
            'border-slate-800 text-slate-500 hover:border-slate-700': !activeSeverity.includes(s) && isDark
          }"
        >{{ s }}</button>
      </div>

      <!-- Search — grows to fill remaining space, wraps on very small screens -->
      <div 
        class="flex items-center border-2 rounded-xl px-4 py-2 focus-within:border-yellow-500/50 transition-all shadow-inner group flex-1 min-w-[160px]"
        :class="isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200'"
      >
        <Search 
          class="w-4 h-4 transition-colors mr-3 shrink-0" 
          :class="isDark ? 'text-slate-500 group-focus-within:text-yellow-500' : 'text-slate-400 group-focus-within:text-yellow-600'"
        />
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="搜尋新聞..." 
          class="bg-transparent outline-none text-xs placeholder-slate-600 w-full font-medium min-w-0"
          :class="isDark ? 'text-slate-200' : 'text-slate-800'"
        />
      </div>
    </div>

    <!-- News Feed -->
    <div class="flex-1 overflow-y-auto scrollbar-thin" :class="isDark ? 'scrollbar-thumb-slate-800' : 'scrollbar-thumb-slate-300'">
      <div v-if="isLoading && newsItems.length === 0" class="flex flex-col items-center justify-center h-64 space-y-4">
        <div class="w-10 h-10 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
        <div class="text-slate-500 font-mono text-xs tracking-widest animate-pulse uppercase">Race control connecting...</div>
      </div>

      <div v-else class="max-w-5xl mx-auto py-6 md:py-8 px-4 md:px-6 space-y-4 md:space-y-5">
        <div
          v-for="item in filteredNews"
          :key="item.id"
          class="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6 border rounded-2xl p-5 md:p-6 transition-all group relative overflow-hidden shadow-xl"
          :class="isDark ? 'bg-[#0f1523]/60 border-slate-800/40 hover:border-yellow-500/40 hover:bg-[#111827]' : 'bg-white border-slate-200 hover:border-yellow-500/60 hover:shadow-2xl'"
        >
          <!-- Left accent bar -->
          <div class="absolute left-0 top-0 bottom-0 w-1.5 transition-all group-hover:w-2" :class="getAccentColor(item.severity)"></div>

          <!-- Source Badge / Avatar (Mobile) -->
          <div class="flex items-center space-x-3 sm:hidden">
            <div 
              class="w-12 h-12 rounded-2xl flex items-center justify-center text-yellow-500 font-black text-lg shrink-0 border-2 shadow-inner italic"
              :class="isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-100 border-slate-200'"
            >
              {{ item.source.charAt(0) }}
            </div>
            <div>
              <span class="font-black text-sm tracking-widest uppercase italic" :class="isDark ? 'text-white' : 'text-slate-900'">{{ item.source }}</span>
              <div class="text-slate-500 text-[10px] font-mono font-bold tracking-tighter">{{ getRelativeTime(item.timestamp) }}</div>
            </div>
          </div>

          <!-- Source Badge / Avatar (Desktop) -->
          <div 
            class="hidden sm:flex w-14 h-14 rounded-2xl flex items-center justify-center text-yellow-500 font-black text-xl shrink-0 mt-0.5 border-2 transition-all shadow-inner italic"
            :class="isDark ? 'bg-slate-800/50 border-slate-700/50 group-hover:border-yellow-500/50' : 'bg-slate-100 border-slate-200 group-hover:border-yellow-500/60'"
          >
            {{ item.source.charAt(0) }}
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-3 mb-3 flex-wrap gap-y-2">
              <span class="hidden sm:inline font-black text-sm tracking-widest uppercase italic" :class="isDark ? 'text-white' : 'text-slate-900'">{{ item.source }}</span>
              <span
                class="text-[10px] font-black px-3 py-1 rounded-md border-2 tracking-widest uppercase italic shadow-sm"
                :class="{
                  'bg-red-500 border-red-400 text-white': item.severity === '器材技術',
                  'bg-orange-500 border-orange-400 text-white': item.severity === '重大焦點',
                  'bg-slate-700 border-slate-600 text-white': item.severity === '一般動態',
                }"
              >{{ item.severity }}</span>
              <span 
                class="text-[10px] font-black px-2.5 py-1 rounded-md border-2 font-mono tracking-widest uppercase italic"
                :class="getCategoryStyle(item.cat, isDark)"
              >{{ item.cat }}</span>
              <span class="hidden sm:inline text-slate-500 text-[11px] font-mono font-bold tracking-tighter">· {{ getRelativeTime(item.timestamp) }}</span>
              
              <!-- Translate button -->
              <button
                @click.stop="toggleTranslate(item)"
                class="ml-auto flex items-center space-x-2 text-[10px] font-black px-3 md:px-4 py-1.5 rounded-xl border-2 transition-all uppercase italic tracking-widest shadow-sm"
                :class="translatedIds.has(item.id)
                  ? 'bg-yellow-500 border-yellow-400 text-black'
                  : (isDark ? 'border-slate-800 text-slate-500 hover:border-yellow-500 hover:text-yellow-500' : 'border-slate-200 text-slate-400 hover:border-yellow-500/60 hover:text-yellow-700')"
              >
                <Languages v-if="!translatingIds.has(item.id)" class="w-3.5 h-3.5" />
                <div v-else class="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span class="hidden xs:inline">{{ translatedIds.has(item.id) ? '原文' : '翻譯' }}</span>
              </button>
            </div>

            <a :href="item.url" target="_blank" class="block group/link">
              <h4 
                class="font-black text-lg md:text-xl leading-tight mb-3 group-hover/link:text-yellow-500 transition-colors uppercase italic tracking-tighter"
                :class="isDark ? 'text-slate-100' : 'text-slate-900'"
              >
                {{ getDisplayItem(item).headline }}
                <span v-if="getDisplayItem(item).isTranslated" class="text-[12px] font-mono ml-3 border border-yellow-500/30 px-2 py-0.5 rounded italic text-yellow-500 shadow-sm">[中文]</span>
              </h4>

              <div class="flex flex-col-reverse md:flex-row items-stretch md:items-start gap-4">
                <p class="text-slate-500 text-sm leading-relaxed line-clamp-2 md:line-clamp-3 flex-1 font-medium" :class="!isDark && 'text-slate-600'">
                  {{ getDisplayItem(item).summary || '點擊閱讀完整賽事報導...' }}
                </p>
                <div v-if="item.image" class="relative group-hover:scale-[1.05] transition-transform shrink-0 duration-500 self-center md:self-start">
                  <img :src="item.image" class="w-full sm:w-40 md:w-32 lg:w-40 h-32 sm:h-24 md:h-20 lg:h-24 rounded-xl object-cover border-2 transition-all" :class="isDark ? 'border-slate-800/80 grayscale-[30%] group-hover:grayscale-0' : 'border-slate-100 shadow-lg'" alt="" />
                  <div class="absolute inset-0 rounded-xl bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                    <MousePointer2 class="w-4 h-4 text-white animate-bounce" />
                  </div>
                </div>
              </div>
            </a>
          </div>
        </div>

        <div v-if="filteredNews.length === 0 && !isLoading" class="flex flex-col items-center justify-center py-20 space-y-4 opacity-50">
          <Globe class="w-12 h-12 text-slate-700" />
          <div class="text-slate-600 text-sm font-mono tracking-widest uppercase">No matching signals found</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-thin::-webkit-scrollbar { width: 8px; }
.scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
.scrollbar-thin::-webkit-scrollbar-thumb { background: #334155; border-radius: 20px; border: 2px solid #05080f; }
.scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #ecc94b; }

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
}
</style>
