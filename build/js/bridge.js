// --- file upload ---
function initUpload() {
  const dropZone = document.getElementById('dropZone')
  const fileInput = document.getElementById('fileInput')
  if (!dropZone || !fileInput) return

  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over') })
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'))

  dropZone.addEventListener('drop', e => {
    e.preventDefault()
    dropZone.classList.remove('drag-over')
    const files = e.dataTransfer?.files
    if (files?.length) handleUpload(files[0])
  })

  dropZone.addEventListener('click', e => {
    if (e.target.tagName !== 'INPUT') fileInput.click()
  })

  fileInput.addEventListener('change', e => {
    const files = e.target?.files
    if (files?.length) handleUpload(files[0])
  })
}

function handleUpload(file) {
  if (!pyodide) return
  const reader = new FileReader()
  reader.onload = () => {
    pyodide.FS.writeFile('/home/pyodide/data.csv', reader.result)
    showUploadSuccess(file.name, file.size)
  }
  reader.readAsText(file)
}

function showUploadSuccess(name, size) {
  document.getElementById('dropZone').innerHTML = `
    <div class="dataset-card">
      <button class="cancel-btn" onclick="resetUpload()"><i class="fas fa-times"></i></button>
      <div class="dataset-title"><i class="fas fa-database"></i> 当前数据集</div>
      <div class="dataset-detail">
        <span><i class="fas fa-file-csv"></i> ${name}</span>
        <span><i class="fas fa-hashtag"></i> ${(size / 1024).toFixed(1)} KB</span>
      </div>
      <div style="margin-top:12px"><span class="badge-success"><i class="far fa-check-circle"></i> 已写入 Pyodide 虚拟 FS</span></div>
    </div>`
}

function resetUpload() {
  document.getElementById('dropZone').innerHTML = `
    <div class="drop-content">
      <div class="drop-icon"><i class="fas fa-cloud-upload-alt"></i></div>
      <div class="drop-text">
        <span class="drop-primary">拖拽文件到此处</span>
        <span class="drop-secondary">或</span>
        <label class="browse-btn">
          浏览文件<input type="file" id="fileInput" accept=".csv,.xlsx,.xls" hidden>
        </label>
      </div>
      <div class="drop-hint">支持 CSV、Excel 文件</div>
    </div>`
  initUpload()
}

// --- stdout capture ---
function captureStdout(moduleName, funcName, params = {}) {
  return new Promise((resolve, reject) => {
    const lines = []
    pyodide.setStdout({ batched: s => lines.push(s) })
    const mod = pyodide.globals.get(moduleName)
    const fn = mod[funcName]
    Promise.resolve(fn(...Object.values(params)))
      .then(result => {
        pyodide.setStdout({ batched: () => {} })
        resolve({ lines, result: result !== undefined ? result.toJs({ dict_converter: Object.fromEntries }) : null })
      })
      .catch(err => {
        pyodide.setStdout({ batched: () => {} })
        reject(err)
      })
  })
}

// --- result rendering ---
function renderModuleResult(container, out) {
  const outputPre = container.querySelector('.py-output')
  if (outputPre && out.lines.length) {
    outputPre.textContent = out.lines.join('\n')
  }

  if (!out.result) return

  const chartBox = container.querySelector('.chart-container')
  if (chartBox && out.result.svg) {
    chartBox.innerHTML = out.result.svg
    const svg = chartBox.querySelector('svg')
    if (svg) svg.style.maxWidth = '100%'
  }

  const metrics = container.querySelectorAll('.metric-value')
  if (metrics.length && out.result.metrics) {
    const vals = Object.values(out.result.metrics)
    metrics.forEach((el, i) => { if (i < vals.length) el.textContent = vals[i] })
  }

  const tbody = container.querySelector('.simple-table tbody')
  if (tbody && out.result.table) {
    tbody.innerHTML = out.result.table.map(
      row => `<tr>${row.map(c => `<td>${c}</td>`).join('')}</tr>`
    ).join('')
  }

  const headerRow = container.querySelector('.simple-table thead tr')
  if (headerRow && out.result.table_header) {
    headerRow.innerHTML = out.result.table_header.map(h => `<th>${h}</th>`).join('')
  }
}

// --- run button handler (callable multiple times) ---
function bindRunButtons() {
  document.querySelectorAll('.btn-run:not([data-bound])').forEach(btn => {
    btn.dataset.bound = 'true'
    btn.addEventListener('click', async () => {
      const mod = btn.dataset.module
      const func = btn.dataset.func
      const container = btn.closest('.module-content')
      const outputPre = container.querySelector('.py-output')

      btn.disabled = true
      btn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> 运行中...'
      if (outputPre) outputPre.textContent = ''

      try {
        const out = await captureStdout(mod, func, {})
        renderModuleResult(container, out)
      } catch (e) {
        if (outputPre) outputPre.textContent = `错误: ${e.message}`
        console.error(e)
      }

      btn.innerHTML = '<i class="fas fa-play"></i> 运行'
      btn.disabled = false
    })
  })
}

// --- init ---
document.addEventListener('DOMContentLoaded', () => {
  initUpload()
  bindRunButtons()

  document.addEventListener('pyodideReady', () => {
    window.pyodideReady = true
    document.querySelectorAll('.btn-run').forEach(b => { b.disabled = false })
    const pyStatus = document.querySelector('.py-status') || document.getElementById('pyStatus')
    if (pyStatus) pyStatus.innerHTML = '<i class="fas fa-check-circle" style="color:#2e7d32;"></i> Pyodide 已就绪'
  })
})
