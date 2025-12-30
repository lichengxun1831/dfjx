// # 交互逻辑（筛选、Banner切换等）
// 全局配置
const CONFIG = {
  carouselAutoPlayTime: 2000, // 轮播自动切换时间（2秒）
  pageSize: 12, // 每页显示案例数量
  currentPage: 1, // 当前页码
  phoneNumber: "15805417038"
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

// 修改renderPagination函数，移动端不渲染分页
function renderPagination(filteredCards) {
  const paginationContainer = document.querySelector('.pagination');
  if (!paginationContainer) return;

  // 移动端不渲染分页
  if (window.innerWidth <= 768) {
    paginationContainer.innerHTML = '';
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

// 修改筛选后显示卡片的逻辑，移动端显示所有卡片
function showCaseCardsByPage(filteredCards, pageNum) {
  // 移动端显示所有卡片
  if (window.innerWidth <= 768) {
    allCaseCards.forEach(card => card.classList.remove('hidden'));
  } else {
    // PC端保持分页逻辑
    allCaseCards.forEach(card => card.classList.add('hidden'));
    const start = (pageNum - 1) * CONFIG.pageSize;
    const end = start + CONFIG.pageSize;
    filteredCards.slice(start, end).forEach(card => card.classList.remove('hidden'));
  }
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

// 新增：移动端筛选面板逻辑
const mobileFilterBtn = document.querySelector('.mobile-filter-btn');
const mobileFilterPanel = document.querySelector('.mobile-filter-panel');
const mobileFilterClose = document.querySelector('.mobile-filter-close');
const filterOverlay = document.querySelector('.filter-overlay');

// 显示筛选面板
function showFilterPanel() {
  mobileFilterPanel.classList.add('active');
  filterOverlay.classList.add('active');
  document.body.style.overflow = 'hidden'; // 防止背景滚动
}

// 隐藏筛选面板
function hideFilterPanel() {
  mobileFilterPanel.classList.remove('active');
  filterOverlay.classList.remove('active');
  document.body.style.overflow = 'auto'; // 恢复背景滚动
}

// 移动端筛选按钮点击事件
mobileFilterBtn?.addEventListener('click', showFilterPanel);

// 关闭按钮点击事件
mobileFilterClose?.addEventListener('click', hideFilterPanel);

// 遮罩层点击事件
filterOverlay?.addEventListener('click', hideFilterPanel);

// ESC键关闭面板
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && mobileFilterPanel.classList.contains('active')) {
    hideFilterPanel();
  }
});

// 筛选标签点击后关闭面板（可选，根据用户体验决定）
document.querySelectorAll('.filter-tag').forEach(tag => {
  tag.addEventListener('click', function () {
    // 原有逻辑保持不变

    // 新增：移动端点击筛选标签后关闭面板
    if (window.innerWidth <= 768) {
      hideFilterPanel();
    }
  });
});

// 显示电话模态弹窗
function showPhoneModal() {
  const modal = document.getElementById('phoneModal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// 隐藏电话模态弹窗
function hidePhoneModal() {
  const modal = document.getElementById('phoneModal');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

// 拨打电话
function makePhoneCall() {
  const phoneNumber = CONFIG.phoneNumber;
  window.location.href = `tel:${phoneNumber}`;
  hidePhoneModal();
}

// 显示微信模态弹窗
function showWechatModal() {
  const modal = document.getElementById('wechatModal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// 隐藏微信模态弹窗
function hideWechatModal() {
  const modal = document.getElementById('wechatModal');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
}