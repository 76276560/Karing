// 全局变量
let currentFileContent = '';
let processedContent = '';
let lastProcessedTime = '';

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadLastUpdateTime();
});

function initializeApp() {
    console.log('订阅管理器初始化完成');
    document.getElementById('updateTime').textContent = new Date().toLocaleString();
}

function setupEventListeners() {
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');

    // 文件选择事件
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });

    // 拖拽事件
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', function() {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });
}

function handleFileSelect(file) {
    if (!file.name.endsWith('.txt')) {
        showStatus('请选择.txt文件', 'error');
        return;
    }

    // 显示文件信息
    document.getElementById('fileInfo').style.display = 'block';
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = formatFileSize(file.size);
    
    const reader = new FileReader();
    reader.onload = function(e) {
        currentFileContent = e.target.result;
        showStatus('文件读取成功', 'success');
        document.getElementById('processBtn').disabled = false;
        
        // 自动处理文件
        setTimeout(processFile, 500);
    };
    
    reader.onerror = function() {
        showStatus('文件读取失败', 'error');
    };
    
    reader.readAsText(file);
}

function processFile() {
    if (!currentFileContent) {
        showStatus('请先选择文件', 'error');
        return;
    }

    try {
        // 处理文件内容 - 提取链接和有效数据
        processedContent = extractSubscriptionContent(currentFileContent);
        
        if (processedContent) {
            showStatus('文件处理成功', 'success');
            document.getElementById('generateBtn').disabled = false;
            document.getElementById('resultContainer').style.display = 'block';
            
            lastProcessedTime = new Date().toLocaleString();
            updateLastProcessedTime();
            
            // 自动生成输出
            setTimeout(generateOutput, 300);
        } else {
            showStatus('未找到有效订阅内容', 'error');
        }
    } catch (error) {
        showStatus('处理失败: ' + error.message, 'error');
        console.error('处理错误:', error);
    }
}

function extractSubscriptionContent(content) {
    // 按行分割并过滤空行
    const lines = content.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#') && !line.startsWith('//'));
    
    if (lines.length === 0) {
        return null;
    }

    // 处理不同类型的订阅内容
    let result = '';
    
    lines.forEach((line, index) => {
        if (isValidSubscriptionLine(line)) {
            // 如果是Base64编码的订阅链接
            if (line.startsWith('http')) {
                result += `${line}\n`;
            } 
            // 如果是直接的ss://链接
            else if (line.startsWith('ss://')) {
                result += `${line}\n`;
            }
            // 如果是Base64编码的内容
            else if (isBase64(line)) {
                try {
                    const decoded = atob(line);
                    if (decoded.includes('ss://') || decoded.includes('http')) {
                        result += `${decoded}\n`;
                    } else {
                        result += `${line}\n`;
                    }
                } catch (e) {
                    result += `${line}\n`;
                }
            } else {
                result += `${line}\n`;
            }
        }
    });

    return result.trim() || content;
}

function isValidSubscriptionLine(line) {
    // 检查是否为有效的订阅内容
    const patterns = [
        /^ss:\/\//,
        /^vmess:\/\//,
        /^vless:\/\//,
        /^trojan:\/\//,
        /^https?:\/\//,
        /^[A-Za-z0-9+/]+={0,2}$/, // Base64
        /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/ // 邮箱格式（某些订阅）
    ];
    
    return patterns.some(pattern => pattern.test(line.trim()));
}

function isBase64(str) {
    try {
        return btoa(atob(str)) === str;
    } catch (err) {
        return false;
    }
}

function generateOutput() {
    if (!processedContent) {
        showResult('没有可用的处理内容', 'error');
        return;
    }

    const output = generateFormattedOutput(processedContent);
    showResult(output, 'success');
}

function generateFormattedOutput(content) {
    const timestamp = new Date().toLocaleString('zh-CN');
    const lines = content.split('\n').filter(line => line.trim());
    
    let output = `# 订阅链接生成结果\n`;
    output += `# 生成时间: ${timestamp}\n`;
    output += `# 总链接数: ${lines.length}\n`;
    output += `# 自动更新: 每天 07:00\n\n`;
    
    lines.forEach((line, index) => {
        if (line.startsWith('http')) {
            output += `${line}\n`;
        } else if (line.startsWith('ss://')) {
            output += `${line}\n`;
        } else {
            output += `${line}\n`;
        }
    });
    
    output += `\n# 文件结束`;
    return output;
}

function showResult(content, type) {
    const resultDiv = document.getElementById('result');
    resultDiv.textContent = content;
    
    const statusDiv = document.getElementById('fileStatus');
    if (type === 'success') {
        statusDiv.className = 'status status-success';
        statusDiv.textContent = '处理完成';
    } else {
        statusDiv.className = 'status status-error';
        statusDiv.textContent = '处理失败';
    }
}

function showStatus(message, type) {
    const statusDiv = document.getElementById('fileStatus');
    statusDiv.textContent = message;
    statusDiv.className = `status status-${type}`;
}

function copyToClipboard() {
    const result = document.getElementById('result').textContent;
    navigator.clipboard.writeText(result).then(() => {
        showStatus('内容已复制到剪贴板', 'success');
    }).catch(() => {
        showStatus('复制失败', 'error');
    });
}

function saveToFile() {
    const content = document.getElementById('result').textContent;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    a.href = url;
    a.download = `订阅链接-${timestamp}.txt`;
    a.click();
    
    URL.revokeObjectURL(url);
    showStatus('文件已保存', 'success');
}

function clearAll() {
    document.getElementById('fileInput').value = '';
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('resultContainer').style.display = 'none';
    document.getElementById('processBtn').disabled = true;
    document.getElementById('generateBtn').disabled = true;
    
    currentFileContent = '';
    processedContent = '';
    
    showStatus('已清空', 'success');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function loadLastUpdateTime() {
    const saved = localStorage.getItem('lastProcessedTime');
    if (saved) {
        lastProcessedTime = saved;
    }
}

function updateLastProcessedTime() {
    localStorage.setItem('lastProcessedTime', lastProcessedTime);
}

// 自动检查更新（模拟）
function checkForAutoUpdate() {
    const now = new Date();
    const updateHour = 7; // 早上7点
    
    if (now.getHours() === updateHour && now.getMinutes() === 0) {
        showStatus('正在执行自动更新...', 'success');
        // 这里可以添加自动更新逻辑
    }
}

// 每分钟检查一次自动更新
setInterval(checkForAutoUpdate, 60000);