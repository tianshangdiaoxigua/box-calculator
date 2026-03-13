// 全局数据存储
let data = {
    quantity: 0,
    length: 0,
    width: 0,
    height: 0,
    nailTongue: 0,
    grossWidth: 0,
    materialPrice: 0,
    printPrice: 0,
    printRatio: 0,
    platePrice: 0,
    shippingCost: 0,
    taxRate: 0,
    profitAmount: 0,
    layerIndex: 0,
    corrugatedIndex: 0
};

// 瓦楞选项配置
const corrugatedOptions = [
    ['E楞(2mm)', 'B楞(3mm)', 'C楞(3.5mm)', 'A楞(4mm)'], // 三层
    ['EB楞(4.1mm)', 'BC楞(6mm)', 'BA楞(7mm)'] // 五层
];

// 输入框变化处理
function handleInputChange(event) {
    const field = event.target.dataset.field;
    let value = event.target.value;

    // 空值处理
    if (value === '' || value === null || value === undefined) {
        value = '0';
    }

    // 小数点处理
    if (value.startsWith('.')) {
        value = '0' + value;
    }

    // 多个小数点处理
    const dotCount = (value.match(/\./g) || []).length;
    if (dotCount > 1) {
        const parts = value.split('.');
        value = parts[0] + '.' + parts.slice(1).join('');
    }

    // 前导零处理
    if (value !== '0' && value !== '0.' && value.length > 1 && value.startsWith('0')) {
        if (value[1] !== '.') {
            value = value.replace(/^0+/, '');
        }
    }

    // 更新数据
    data[field] = value;
    // 实时计算
    calculateAll();
}

// 输入框失焦处理
function handleInputBlur(event) {
    const field = event.target.dataset.field;
    let value = event.target.value;

    if (value === '' || value === null || value === undefined) {
        value = '0';
    }

    // 处理以小数点结尾的情况
    if (value.endsWith('.')) {
        value = value + '0';
    }

    // 处理单个小数点的情况
    if (value === '.') {
        value = '0.0';
    }

    // 更新输入框和数据
    event.target.value = value;
    data[field] = value;
    calculateAll();
}

// 层数变化处理
function handleLayerChange(event) {
    const layerIndex = parseInt(event.target.value);
    data.layerIndex = layerIndex;
    
    // 更新瓦楞选择器选项
    const corrugatedSelect = document.getElementById('corrugatedSelect');
    // 清空原有选项
    corrugatedSelect.innerHTML = '';
    // 添加新选项
    corrugatedOptions[layerIndex].forEach((option, index) => {
        const opt = document.createElement('option');
        opt.value = index;
        opt.textContent = option;
        corrugatedSelect.appendChild(opt);
    });
    
    // 重置瓦楞索引
    data.corrugatedIndex = 0;
    calculateAll();
}

// 瓦楞类型变化处理
function handleCorrugatedChange(event) {
    data.corrugatedIndex = parseInt(event.target.value);
    calculateAll();
}

// 安全的数值转换
function toNumber(value) {
    if (value === '' || value === null || value === undefined) return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
}

// 计算普通纸箱面积（含钉舌、毛宽）
function getNormalArea() {
    const L = toNumber(data.length);
    const W = toNumber(data.width);
    const H = toNumber(data.height);
    const nailTongue = toNumber(data.nailTongue);
    const grossWidth = toNumber(data.grossWidth);
    
    if (L <= 0 || W <= 0 || H <= 0) return 0;
    
    // 核心公式：((长+宽)*2+钉舌) * (宽+高+毛宽) / 1000000
    return ((L + W) * 2 + nailTongue) * (W + H + grossWidth) / 1000000;
}

// 获取瓦楞厚度
function getThickness() {
    const layerIndex = data.layerIndex;
    const corrugatedIndex = data.corrugatedIndex;
    
    if (layerIndex === 0) { // 三层
        switch(corrugatedIndex) {
            case 0: return 2; // E楞
            case 1: return 3; // B楞
            case 2: return 3.5; // C楞
            case 3: return 4; // A楞
            default: return 2;
        }
    } else { // 五层
        switch(corrugatedIndex) {
            case 0: return 4.1; // EB楞
            case 1: return 6; // BC楞
            case 2: return 7; // BA楞
            default: return 4.1;
        }
    }
}

// 计算普通纸箱成本
function calculateNormalBox() {
    try {
        // 1. 计算面积
        const area = getNormalArea();
        
        // 2. 材料成本
        const materialPrice = toNumber(data.materialPrice);
        const materialCost = area * materialPrice;
        
        // 3. 印刷成本
        const printPrice = toNumber(data.printPrice);
        const printRatio = toNumber(data.printRatio);
        const printCost = area * (printRatio / 100) * printPrice;
        
        // 4. 版费分摊
        const quantity = toNumber(data.quantity);
        const platePrice = toNumber(data.platePrice);
        const safeQuantity = Math.max(quantity, 1); // 防除零
        const plateCostPerUnit = platePrice / safeQuantity;
        
        // 5. 运费分摊
        const shippingCost = toNumber(data.shippingCost);
        const shippingCostPerUnit = shippingCost / safeQuantity;
        
        // 6. 税前成本
        const preTaxCost = materialCost + printCost + plateCostPerUnit + shippingCostPerUnit;
        
        // 7. 税费
        const taxRate = toNumber(data.taxRate);
        const taxAmount = preTaxCost * (taxRate / 100);
        
        // 8. 最终报价
        const profitAmount = toNumber(data.profitAmount);
        const finalPrice = preTaxCost + taxAmount + profitAmount;
        
        // 9. 体积计算
        const thickness = getThickness();
        const singleVolume = area * (thickness / 1000);
        const totalVolume = singleVolume * quantity;
        
        // 10. 更新页面显示结果
        document.getElementById('areaResult').textContent = area.toFixed(4) + '㎡';
        document.getElementById('materialCostResult').textContent = '¥' + materialCost.toFixed(2);
        document.getElementById('printCostResult').textContent = '¥' + printCost.toFixed(2);
        document.getElementById('plateCostResult').textContent = '¥' + plateCostPerUnit.toFixed(2);
        document.getElementById('shippingCostResult').textContent = '¥' + shippingCostPerUnit.toFixed(2);
        document.getElementById('preTaxCostResult').textContent = '¥' + preTaxCost.toFixed(2);
        document.getElementById('taxAmountResult').textContent = '¥' + taxAmount.toFixed(2);
        document.getElementById('profitAmountResult').textContent = '¥' + profitAmount.toFixed(2);
        document.getElementById('finalPriceResult').textContent = '¥' + finalPrice.toFixed(2);
        document.getElementById('singleVolumeResult').textContent = singleVolume.toFixed(6) + 'm³';
        document.getElementById('totalVolumeResult').textContent = totalVolume.toFixed(3) + 'm³';
        
    } catch (error) {
        console.error('计算错误:', error);
    }
}

// 执行所有计算
function calculateAll() {
    calculateNormalBox();
}

// 重置所有数据
function resetAll() {
    // 重置数据对象
    data = {
        quantity: 0,
        length: 0,
        width: 0,
        height: 0,
        nailTongue: 0,
        grossWidth: 0,
        materialPrice: 0,
        printPrice: 0,
        printRatio: 0,
        platePrice: 0,
        shippingCost: 0,
        taxRate: 0,
        profitAmount: 0,
        layerIndex: 0,
        corrugatedIndex: 0
    };
    
    // 重置输入框
    const inputFields = [
        'quantity', 'length', 'width', 'height', 'nailTongue', 'grossWidth',
        'materialPrice', 'printPrice', 'printRatio', 'platePrice', 'shippingCost',
        'taxRate', 'profitAmount'
    ];
    inputFields.forEach(field => {
        const input = document.querySelector(`[data-field="${field}"]`);
        if (input) input.value = '0';
    });
    
    // 重置层数和瓦楞选择器
    document.querySelector('select.picker').value = 0;
    const corrugatedSelect = document.getElementById('corrugatedSelect');
    corrugatedSelect.innerHTML = '';
    corrugatedOptions[0].forEach((option, index) => {
        const opt = document.createElement('option');
        opt.value = index;
        opt.textContent = option;
        corrugatedSelect.appendChild(opt);
    });
    
    // 重新计算（重置结果）
    calculateAll();
    
    // 提示重置成功
    alert('数据已重置！');
}

// 页面加载完成后初始化
window.onload = function() {
    // 初始化瓦楞选择器
    const corrugatedSelect = document.getElementById('corrugatedSelect');
    corrugatedSelect.innerHTML = '';
    corrugatedOptions[0].forEach((option, index) => {
        const opt = document.createElement('option');
        opt.value = index;
        opt.textContent = option;
        corrugatedSelect.appendChild(opt);
    });
    // 初始计算（显示0值）
    calculateAll();
};