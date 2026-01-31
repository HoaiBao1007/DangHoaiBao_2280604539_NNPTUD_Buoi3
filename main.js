// API URL
const API_URL = 'https://api.escuelajs.co/api/v1/products';

// Default fallback image
const DEFAULT_IMG = 'https://i.imgur.com/1k9dY5L.png';

// Biến lưu trữ danh sách sản phẩm gốc
let allProducts = [];
let currentPage = 1;
let itemsPerPage = 10;
let filteredProducts = [];
let currentSort = null; // Lưu trạng thái sắp xếp hiện tại

// Hàm getAll - Lấy tất cả sản phẩm từ API
async function getAll() {
    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`Lỗi HTTP! Status: ${response.status}`);
        }
        
        allProducts = await response.json();
        filteredProducts = allProducts;
        currentPage = 1;
        displayPaginatedTable();
        
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu:', error);
        showError('Không thể tải dữ liệu sản phẩm. Vui lòng thử lại sau.');
    }
}

// Hàm hiển thị bảng sản phẩm
function displayTable(products) {
    const tableContainer = document.getElementById('tableContainer');
    const loading = document.getElementById('loading');
    const resultCount = document.getElementById('resultCount');
    
    // Ẩn loading
    loading.style.display = 'none';
    
    if (!products || products.length === 0) {
        tableContainer.innerHTML = '<p style="text-align: center; color: #999;">Không có sản phẩm nào.</p>';
        resultCount.textContent = 'Kết quả: 0';
        return;
    }
    
    // Cập nhật số lượng kết quả
    resultCount.textContent = `Kết quả: ${products.length}`;
    
    // Tạo bảng HTML
    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Hình ảnh</th>
                    <th>Tên sản phẩm</th>
                    <th>Mô tả</th>
                    <th>Giá</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    products.forEach(product => {
        const description = product.description ? product.description.substring(0, 100) + '...' : 'Không có mô tả';

        // Lấy URL hình ảnh đầu tiên từ mảng images hoặc các trường thay thế
        let imageUrl = DEFAULT_IMG;
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            imageUrl = product.images[0];
        } else if (product.image) {
            imageUrl = product.image;
        } else if (product.thumbnail) {
            imageUrl = product.thumbnail;
        }

        // sanitize / normalize URL and apply fallback
        function cleanImageUrl(url) {
            if (!url) return DEFAULT_IMG;
            if (Array.isArray(url)) url = url.length ? url[0] : null;
            if (typeof url === 'object' && url !== null) url = url.url || url.src || null;
            if (!url || typeof url !== 'string') return DEFAULT_IMG;
            url = url.trim();
            if (url.startsWith('/')) url = 'https://api.escuelajs.co' + url;
            if (url.startsWith('data:image/')) return url;
            const m = url.match(/^(https?:\/\/[^\s"']+)/i);
            if (m) {
                const clean = m[1];
                if (clean.includes('placeimg.com') || clean.includes('via.placeholder.com')) return DEFAULT_IMG;
                return clean;
            }
            return DEFAULT_IMG;
        }

        imageUrl = cleanImageUrl(imageUrl);

        const price = product.price ? `$${product.price.toFixed(2)}` : 'N/A';

        tableHTML += `
            <tr>
                <td>${product.id}</td>
                <td>
                    <img src="${imageUrl}" 
                         alt="${product.title}" 
                         class="product-image" 
                         loading="lazy"
                         crossorigin="anonymous"
                         referrerpolicy="no-referrer"
                         onerror="this.onerror=null;this.src='${DEFAULT_IMG}';"
                         onclick="openImageModal('${product.id}', '${imageUrl.replace(/'/g, "\\'")}', '${product.title.replace(/'/g, "\\'")}', '${description.replace(/'/g, "\\'")}', '${price}')">
                </td>
                <td>${product.title}</td>
                <td>${description}</td>
                <td><span class="price">${price}</span></td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    tableContainer.innerHTML = tableHTML;
}

// Hàm mở modal hiển thị hình ảnh lớn
function openImageModal(id, imageUrl, title, description, price) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');
    const modalPrice = document.getElementById('modalPrice');
    
    // Giải mã URL nếu cần
    const decodedUrl = decodeURIComponent(imageUrl);
    
    modalImage.src = decodedUrl;
    modalTitle.textContent = title;
    modalDescription.textContent = description;
    modalPrice.textContent = price;
    
    modal.style.display = 'block';
}

// Hàm tìm kiếm sản phẩm theo title
function filterProducts() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (!searchTerm) {
        // Nếu ô tìm kiếm trống, hiển thị tất cả sản phẩm
        filteredProducts = [...allProducts];
    } else {
        // Lọc sản phẩm theo tiêu đề
        filteredProducts = allProducts.filter(product => 
            product.title.toLowerCase().includes(searchTerm)
        );
    }
    
    // Áp dụng lại sắp xếp hiện tại nếu có
    if (currentSort) {
        if (currentSort.type === 'price') {
            sortByPrice(currentSort.direction);
        } else if (currentSort.type === 'name') {
            sortByName(currentSort.direction);
        }
    }
    
    currentPage = 1; // Reset về trang 1 khi tìm kiếm
    displayPaginatedTable();
}

// Hàm hiển thị bảng với phân trang
function displayPaginatedTable() {
    // Tính toán chỉ số bắt đầu và kết thúc
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    // Hiển thị bảng
    displayTable(paginatedProducts);
    
    // Cập nhật pagination controls
    updatePaginationControls();
}

// Hàm cập nhật pagination controls
function updatePaginationControls() {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    pageInfo.textContent = `Trang ${currentPage} / ${totalPages}`;
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
}

// Hàm đi trang trước
function previousPage() {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    if (currentPage > 1) {
        currentPage--;
        displayPaginatedTable();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Hàm đi trang sau
function nextPage() {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayPaginatedTable();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Hàm thay đổi số sản phẩm mỗi trang
function changeItemsPerPage() {
    const select = document.getElementById('itemsPerPage');
    itemsPerPage = parseInt(select.value);
    currentPage = 1; // Reset về trang 1
    displayPaginatedTable();
}

// Hàm sắp xếp theo giá
function sortByPrice(direction) {
    currentSort = { type: 'price', direction };
    
    if (direction === 'asc') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else {
        filteredProducts.sort((a, b) => b.price - a.price);
    }
    
    currentPage = 1;
    updateSortButtons();
    displayPaginatedTable();
}

// Hàm sắp xếp theo tên
function sortByName(direction) {
    currentSort = { type: 'name', direction };
    
    if (direction === 'asc') {
        filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
    } else {
        filteredProducts.sort((a, b) => b.title.localeCompare(a.title));
    }
    
    currentPage = 1;
    updateSortButtons();
    displayPaginatedTable();
}

// Hàm reset sắp xếp
function resetSort() {
    currentSort = null;
    filteredProducts = [...allProducts];
    
    // Áp dụng lại filter nếu có
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product => 
            product.title.toLowerCase().includes(searchTerm)
        );
    }
    
    currentPage = 1;
    updateSortButtons();
    displayPaginatedTable();
}

// Hàm cập nhật trạng thái nút sắp xếp
function updateSortButtons() {
    const buttons = document.querySelectorAll('.sort-btn:not(.reset-btn)');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    if (!currentSort) return;
    
    if (currentSort.type === 'price') {
        const btnId = currentSort.direction === 'asc' ? 'sortPriceAsc' : 'sortPriceDesc';
        document.getElementById(btnId).classList.add('active');
    } else if (currentSort.type === 'name') {
        const btnId = currentSort.direction === 'asc' ? 'sortNameAsc' : 'sortNameDesc';
        document.getElementById(btnId).classList.add('active');
    }
}

// Đóng modal
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('imageModal');
    const closeModal = document.querySelector('.close-modal');
    
    closeModal.onclick = function() {
        modal.style.display = 'none';
    }
    
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    }
    
    // Gọi hàm getAll khi trang load
    getAll();
});

// Hàm hiển thị lỗi
function showError(message) {
    const errorDiv = document.getElementById('error');
    const loading = document.getElementById('loading');
    
    loading.style.display = 'none';
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}
