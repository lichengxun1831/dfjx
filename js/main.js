// # 交互逻辑（筛选、Banner切换等）
// 全局配置
const CONFIG = {
  carouselAutoPlayTime: 2000, // 轮播自动切换时间（2秒）
  pageSize: 12, // 每页显示案例数量
  currentPage: 1 // 当前页码
};
// ====================== 轮播图逻辑 ======================
const carouselItems = document.querySelectorAll('.carousel-item');
const indicators = document.querySelectorAll('.indicator');
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');
const readFullBtns = document.querySelectorAll('.read-full-btn');
let currentCarouselIndex = 0; // 避免和分页currentPage重名

// 切换轮播项函数
function switchCarousel(index) {
  // 隐藏当前项（先容错：判断元素是否存在）
  if (carouselItems[currentCarouselIndex]) {
    carouselItems[currentCarouselIndex].classList.remove('active');
  }
  if (indicators[currentCarouselIndex]) {
    indicators[currentCarouselIndex].classList.remove('active');
  }
  // 显示目标项
  currentCarouselIndex = index;
  if (carouselItems[currentCarouselIndex]) {
    carouselItems[currentCarouselIndex].classList.add('active');
  }
  if (indicators[currentCarouselIndex]) {
    indicators[currentCarouselIndex].classList.add('active');
  }
}

// 下一张
nextBtn?.addEventListener('click', () => { // ?. 容错：无按钮时不报错
  let nextIndex = currentCarouselIndex + 1;
  if (nextIndex >= carouselItems.length) nextIndex = 0;
  switchCarousel(nextIndex);
});

// 上一张
prevBtn?.addEventListener('click', () => { // ?. 容错
  let prevIndex = currentCarouselIndex - 1;
  if (prevIndex < 0) prevIndex = carouselItems.length - 1;
  switchCarousel(prevIndex);
});

// 指示器点击
indicators.forEach((indicator, index) => {
  indicator.addEventListener('click', () => {
    switchCarousel(index);
  });
});

// 阅读全文按钮：跳转到当前轮播项的详情链接（新增）
readFullBtns?.forEach(btn => { // ?. 容错：无按钮时不执行
  btn.addEventListener('click', () => {
    // 获取当前激活轮播项的data-detail-link（容错）
    const activeItem = document.querySelector('.carousel-item.active');
    if (!activeItem) return; // 无激活项时退出
    const detailLink = activeItem.getAttribute('data-detail-link');
    if (detailLink) { // 有链接才打开
      window.open(detailLink, '_blank');
    }
  });
});

// ====================== 筛选+搜索+分页核心逻辑 ======================

// 初始化筛选条件（默认选中“全部”）筛选功能核心逻辑
const filterConditions = {
  industry: "all",
  scale: "all",
  nature: "all",
  scene: "all"
};
// 2. 获取所有案例卡片（缓存）
const allCaseCards = Array.from(document.querySelectorAll('.case-card')) || [];
// 3. 筛选函数：根据条件过滤卡片
function getFilteredCards() {
  return allCaseCards.filter(card => {
    // 获取卡片筛选属性（容错）
    const cardIndustry = card.getAttribute('data-industry') || "all";
    const cardScale = card.getAttribute('data-scale') || "all";
    const cardNature = card.getAttribute('data-nature') || "all";
    const cardScene = card.getAttribute('data-scene') || "all";

    // 判断是否符合所有筛选条件
    return (
      (filterConditions.industry === "all" || filterConditions.industry === cardIndustry) &&
      (filterConditions.scale === "all" || filterConditions.scale === cardScale) &&
      (filterConditions.nature === "all" || filterConditions.nature === cardNature) &&
      (filterConditions.scene === "all" || filterConditions.scene === cardScene)
    );
  });
}
// 4. 模糊搜索函数（多维度匹配：标题/描述/公司/标签 + 结合筛选）
function searchCaseCards(text) {
  // 先筛选所有符合筛选条件的卡片
  let filteredByFilter = getFilteredCards();
  // 若有搜索词，再过滤
  if (text) {
    filteredByFilter = filteredByFilter.filter(card => {
      // 获取可搜索元素（容错）
      const titleEl = card.querySelector('.case-card-title') || card.querySelector('h6');
      const companyNameEl = card.querySelector('.case-card-company');
      const descEl = card.querySelector('.case-card-desc');
      const tagsEl = card.querySelector('.case-card-tags');

      // 提取文本并转小写
      const title = titleEl ? titleEl.textContent.toLowerCase() : '';
      const desc = descEl ? descEl.textContent.toLowerCase() : '';
      const companyName = companyNameEl ? companyNameEl.textContent.toLowerCase() : '';
      const tags = tagsEl ? tagsEl.textContent.toLowerCase() : '';

      // 模糊匹配任意一项
      return title.includes(text) || desc.includes(text) || companyName.includes(text) || tags.includes(text);
    });
  }
  // 重置页码为1，重新渲染分页和卡片
  CONFIG.currentPage = 1;
  renderPagination(filteredByFilter);
  showCaseCardsByPage(filteredByFilter, CONFIG.currentPage);
}

// 5. 分页渲染函数（动态生成按钮，匹配H5样式）
function renderPagination(filteredCards) {
  const paginationContainer = document.querySelector('.pagination');
  if (!paginationContainer) {
    console.error('分页容器.pagination不存在');
    return;
  }

  // 计算总页数
  const totalPages = Math.ceil(filteredCards.length / CONFIG.pageSize);
  // 清空原有内容（避免重复）
  paginationContainer.innerHTML = '';

  // 生成上一页按钮
  const prevPageBtn = document.createElement('button');
  prevPageBtn.className = 'page-btn'; // 和H5样式类名一致
  prevPageBtn.textContent = '<';
  // 禁用逻辑（可选，根据样式需求）
  if (CONFIG.currentPage === 1) prevPageBtn.disabled = true;
  prevPageBtn.addEventListener('click', () => {
    if (CONFIG.currentPage > 1) {
      CONFIG.currentPage--;
      showCaseCardsByPage(filteredCards, CONFIG.currentPage);
      renderPagination(filteredCards); // 重新渲染分页（更新禁用/激活态）
    }
  });
  paginationContainer.appendChild(prevPageBtn);

  // 生成数字页码（最多显示10个，避免按钮过多）
  const maxShowPages = 10;
  let startPage = Math.max(1, CONFIG.currentPage - Math.floor(maxShowPages / 2));
  let endPage = startPage + maxShowPages - 1;
  if (endPage > totalPages) endPage = totalPages;

  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement('button');
    // 激活态类名和H5一致：page-btn + active
    pageBtn.className = `page-btn ${i === CONFIG.currentPage ? 'active' : ''}`;
    pageBtn.textContent = i;
    pageBtn.addEventListener('click', () => {
      CONFIG.currentPage = i;
      showCaseCardsByPage(filteredCards, CONFIG.currentPage);
      renderPagination(filteredCards); // 重新渲染
    });
    paginationContainer.appendChild(pageBtn);
  }

  // 生成下一页按钮
  const nextPageBtn = document.createElement('button');
  nextPageBtn.className = 'page-btn';
  nextPageBtn.textContent = '>';
  if (CONFIG.currentPage === totalPages) nextPageBtn.disabled = true;
  nextPageBtn.addEventListener('click', () => {
    if (CONFIG.currentPage < totalPages) {
      CONFIG.currentPage++;
      showCaseCardsByPage(filteredCards, CONFIG.currentPage);
      renderPagination(filteredCards); // 重新渲染
    }
  });
  paginationContainer.appendChild(nextPageBtn);
}

// 6. 显示指定页码的案例卡片
function showCaseCardsByPage(filteredCards, pageNum) {
  // 先隐藏所有卡片
  allCaseCards.forEach(card => card.classList.add('hidden'));
  // 计算显示范围
  const start = (pageNum - 1) * CONFIG.pageSize;
  const end = start + CONFIG.pageSize;
  // 显示当前页的卡片
  filteredCards.slice(start, end).forEach(card => card.classList.remove('hidden'));
}


// 7. 标签点击事件：切换样式 + 更新筛选条件 + 筛选卡片
document.querySelectorAll('.filter-tag').forEach(tag => {
  tag.addEventListener('click', function () {
    if (this.classList.contains('dropdown-btn')) return;

    const type = this.getAttribute('data-type');
    const value = this.getAttribute('data-value');
    if (!type || !value) return;

    // 切换筛选标签样式
    document.querySelectorAll(`.filter-tag[data-type="${type}"]`).forEach(t => t.classList.remove('active'));
    this.classList.add('active');

    // 更新筛选条件
    filterConditions[type] = value;

    // 筛选后重新分页
    const filtered = getFilteredCards();
    CONFIG.currentPage = 1;
    renderPagination(filtered);
    showCaseCardsByPage(filtered, CONFIG.currentPage);
  });
});

// 8. 搜索框事件绑定
const searchInput = document.querySelector('.search-input');
const searchBtn = document.querySelector('.search-btn');
if (searchBtn && searchInput) {
  // 搜索按钮点击
  searchBtn.addEventListener('click', () => {
    const searchText = searchInput.value.trim().toLowerCase();
    searchCaseCards(searchText);
  });

  // 按Enter键搜索
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // 阻止默认行为（比如页面滚动）
      const searchText = searchInput.value.trim().toLowerCase();
      searchCaseCards(searchText);
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  // 轮播图初始化：激活第一个轮播项
  if (carouselItems.length > 0 && indicators.length > 0) {
    switchCarousel(0);
    // 可选：添加自动轮播（匹配CONFIG中的配置）
    setInterval(() => {
      let nextIndex = currentCarouselIndex + 1;
      if (nextIndex >= carouselItems.length) nextIndex = 0;
      switchCarousel(nextIndex);
    }, CONFIG.carouselAutoPlayTime);
  }

  // 筛选+分页初始化
  const initialFiltered = getFilteredCards();
  renderPagination(initialFiltered);
  showCaseCardsByPage(initialFiltered, CONFIG.currentPage);

  // 验证分页容器位置（调试用，可保留）
  const paginationContainer = document.querySelector('.pagination');
  if (paginationContainer) {
    console.log('分页容器位置:', paginationContainer.offsetParent);
  } else {
    console.error('分页容器.pagination不存在，请检查HTML结构');
  }
});