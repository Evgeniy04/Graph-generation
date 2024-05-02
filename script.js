const form = document.querySelector("form");
form.addEventListener("submit", generate);
let isDirected;

function generate(event) {
  event.preventDefault();

  // Получаем значения формы
  const formData = new FormData(form),
    dimension = parseInt(formData.get("dimension")),
    fullGraph = formData.get("btncheckfull"),
    multipleEdgeGraph = formData.get("btncheckmultiples"),
    loopsGraph = formData.get("btncheckloops");

  let adjacencyMatrix = fullGraph ? generateAdjacencyMatrixOfCompleteGraph(dimension) : generateAdjacencyMatrix(dimension);

  // Параметр, определяющий тип графа (true - ориентированный, false - неориентированный)
  isDirected = determineGraphType(adjacencyMatrix);

  // Добавляем к матрице кратные рёбра и/или петли
  adjacencyMatrix = multipleEdgeGraph ? addMultipleEdges(adjacencyMatrix) : adjacencyMatrix;
  adjacencyMatrix = loopsGraph ? addLoops(adjacencyMatrix) : adjacencyMatrix;

  // Делаем кнопки показа матриц видимыми
  document.querySelector('button[data-bs-target="#showAdjacencyMatrixModal"]').classList.remove("d-none");
  document.querySelector('button[data-bs-target="#showIncidenceMatrixModal"]').classList.remove("d-none");
  document.querySelector('button[data-bs-target="#showMetricMatrixModal"]').classList.remove("d-none");

  // Отображение матрицы смежности
  let theadAdjacencyMatrix = adjacencyMatrix.map((_, i) => `<th scope="col">${i}</th>`).join("");
  let contentAdjacencyMatrix = "";
  for (let i = 0; i < dimension; i++) {
    contentAdjacencyMatrix += `<tr><th scope="row">${i}</th>`;
    for (let j = 0; j < dimension; j++) {
      contentAdjacencyMatrix += `<td>${adjacencyMatrix[i][j]}</td>`;
    }
    contentAdjacencyMatrix += `</tr>`;
  }
  let tableAdjacencyMatrix = document.querySelector("#showAdjacencyMatrixModal table.table");
  tableAdjacencyMatrix.innerHTML = `<thead>
        <tr>
            <th scope="col">Вершина</th>
            ${theadAdjacencyMatrix}
        </tr>
        </thead>
        <tbody>
        ${contentAdjacencyMatrix}
        </tbody>`;

  // Создаем массив узлов и массив ребер на основе матрицы смежности
  let nodes = [];
  let edges = [];
  let edgeCount = 0;
  for (let i = 0; i < dimension; i++) {
    nodes.push({ id: i, label: String(i) });
    for (let j = i; j < dimension; j++) {
      const count = adjacencyMatrix[i][j];
      if (count <= 0) continue;
      for (let k = 0; k < count; k++) {
        edges.push({ id: edgeCount, from: i, to: j, label: `e${edgeCount}` });
        edgeCount++;
      }
    }
  }

  // Создаем объект данных для графа
  const data = {
    nodes: new vis.DataSet(nodes),
    edges: new vis.DataSet(edges),
  };

  // Рисуем направление, если граф ориентированный
  const options = {
    edges: {
      arrows: {
        to: isDirected,
      },
    },
  };

  // Создаем граф
  const container = document.getElementById("network");
  new vis.Network(container, data, options);

  // Создаем матрицу инцидентности
  const incidenceMatrix = createIncidenceMatrix(adjacencyMatrix, edges);

  // Отображение матрицы инцидентности
  let theadIncidenceMatrix = edges.map((v) => `<th scope="col">${v.label}</th>`).join("");
  let contentIncidenceMatrix = "";
  for (let i = 0; i < dimension; i++) {
    contentIncidenceMatrix += `<tr><th scope="row">${i}</th>`;
    for (let j = 0; j < edges.length; j++) {
      contentIncidenceMatrix += `<td>${incidenceMatrix[i][j]}</td>`;
    }
    contentIncidenceMatrix += `</tr>`;
  }
  let tableIncidenceMatrix = document.querySelector("#showIncidenceMatrixModal table.table");
  tableIncidenceMatrix.innerHTML = `<thead>
        <tr>
            <th scope="col">Вершина/Ребро</th>
            ${theadIncidenceMatrix}
        </tr>
        </thead>
        <tbody>
        ${contentIncidenceMatrix}
        </tbody>`;

  // Создаем матрицу метрик
  const metricMatrix = computeMetricMatrix(adjacencyMatrix);

  // Отображение матрицы метрик
  let contentMetricMatrix = "";
  for (let i = 0; i < dimension; i++) {
    contentMetricMatrix += `<tr>`;
    for (let j = 0; j < dimension; j++) {
      contentMetricMatrix += `<td>${metricMatrix[i][j]}</td>`;
    }
    contentMetricMatrix += `</tr>`;
  }
  let tableMetricMatrix = document.querySelector("#showMetricMatrixModal table.table");
  tableMetricMatrix.innerHTML = `
        <tbody>
        ${contentMetricMatrix}
        </tbody>`;

  const { radius, diameter } = findRadiusAndDiameter(metricMatrix);
  console.log("Радиус графа:", radius);
  console.log("Диаметр графа:", diameter);

  const { centralVertices, peripheralVertices } = findCentralAndPeripheralVertices(metricMatrix);
  console.log("Центральные вершины:", centralVertices);
  console.log("Периферийные вершины:", peripheralVertices);
}

// Генерация матрицы смежности ориентированного графа без петель и кратных рёбер
function generateAdjacencyMatrix(n) {
  const matrix = Array.from({ length: n }, () => Array.from({ length: n }, () => 0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      matrix[i][j] = Math.round(Math.random());
      matrix[j][i] = matrix[i][j];
    }
  }

  return matrix;
}
// Генерация матрицы смежности полного графа без петель и кратных рёбер
function generateAdjacencyMatrixOfCompleteGraph(n) {
  const matrix = new Array(n).fill(0).map((_, i) => [...Array(n)].map((_, j) => (i === j ? 0 : 1)));

  return matrix;
}
// Добавить кратные рёбра
function addMultipleEdges(matrix) {
  for (let i = 0; i < matrix.length; i++) {
    let lim = isDirected ? matrix.length : i + 1;
    for (let j = 0; j < lim; j++) {
      const count = matrix[i][j];
      if (count <= 0) continue;
      matrix[i][j] = Math.round(Math.random()) + 1;
      matrix[j][i] = isDirected ? matrix[j][i] : matrix[i][j];
    }
  }

  return matrix;
}
// Добавить петли
function addLoops(matrix) {
  matrix = matrix.map((_, i) =>
    _.map((v, j) => {
      if (i === j) return Math.round(Math.random());
      return v;
    })
  );

  return matrix;
}
// Функция для создания матрицы инцидентности
function createIncidenceMatrix(matrix, edges) {
  const incidenceMatrix = Array.from({ length: matrix.length }, () => Array.from({ length: edges.length }, () => 0));

  let edgeCount = 0;
  for (let i = 0; i < matrix.length; i++) {
    for (let j = i; j < matrix.length; j++) {
      if (matrix[i][j] > 0) {
        for (let _ = 0; _ < matrix[i][j]; _++) {
          incidenceMatrix[i][edgeCount] += 1;
          incidenceMatrix[j][edgeCount] += 1;

          edgeCount++;
        }
      }
    }
  }

  return incidenceMatrix;
}
// Функция для определения типа графа (ориентированный или неориентированный)
function determineGraphType(matrix) {
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < i; j++) {
      if (matrix[i][j] !== matrix[j][i]) {
        return true;
      }
    }
  }
  return false;
}

/* МАТРИЦА МЕТРИКИ  */
// Функция для проверки, является ли матрица S устойчивой
function isStable(prevS, currentS) {
  for (let i = 0; i < prevS.length; i++) {
    for (let j = 0; j < prevS.length; j++) {
      if (prevS[i][j] !== currentS[i][j]) {
        return false;
      }
    }
  }
  return true;
}

// Умножение матриц
function multiplyMatrices(a, b) {
  let result = [];

  // Проверка валидности матриц
  if (a.length === 0 || b.length === 0 || a[0].length !== b.length) {
    throw "Невозможно умножить матрицы: некорректные размеры";
  }

  // Создание результирующей матрицы
  for (let i = 0; i < a.length; i++) {
    result[i] = [];
    for (let j = 0; j < b[0].length; j++) {
      result[i][j] = 0;
      for (let k = 0; k < a[0].length; k++) {
        result[i][j] += a[i][k] * b[k][j];
      }
    }
  }

  return result;
}

// Функция для вычисления матрицы метрик графа
// R - матрица смежности
// M - матрица метрик
// S = R + E, где E - единичная матрица
function computeMetricMatrix(R) {
  S = R.map((array, i) => array.map((value, j) => (i === j ? ++value : value))); // К матрице смежности прибавляем единичную матрицу
  M = Array.from({ length: R.length }, (_, i) => Array.from({ length: R.length }, (_, j) => (i === j ? 0 : undefined))); // Создаём матрицу метрика (такой же размерности, как и R), все элементы которой не определены

  let k = 1;

  while (true) {
    let isFullMetricMatrix = true;
    for (let i = 0; i < M.length; i++) {
      for (let j = 0; j < M.length; j++) {
        if (M[i][j] === undefined) {
          isFullMetricMatrix = false;
        }
        if (M[i][j] === undefined && S[i][j] !== 0) {
          M[i][j] = k; // Всем элементам M[i][j], значения которых не определены, присвоить значение степени k, если соответствующие им элементы матрицы S^k ≠ 0
        }
      }
    }

    let currentS = multiplyMatrices(S, S); // Повышаем степень k

    // Проверяем, является ли матрица S_(k-1) устойчивой.
    if (isStable(S, currentS)) break; // Если матрица S_(k-1) не устойчива, повторяем шаги
    S = currentS;
    k++;
    if (isFullMetricMatrix) break;
  }

  for (let i = 0; i < M.length; i++) {
    for (let j = 0; j < M.length; j++) {
      if (M[i][j] === undefined) {
        M[i][j] = Infinity;
      }
    }
  }

  return M;
}

// Функция для нахождения радиуса и диаметра графа
function findRadiusAndDiameter(metricMatrix) {
  let radius = Infinity;
  let diameter = -Infinity;

  for (let i = 0; i < metricMatrix.length; i++) {
    let maxDistance = -Infinity;
    for (let j = 0; j < metricMatrix.length; j++) {
      if (i !== j && metricMatrix[i][j] !== Infinity) {
        maxDistance = Math.max(maxDistance, metricMatrix[i][j]);
      }
    }
    radius = Math.min(radius, maxDistance);
    diameter = Math.max(diameter, maxDistance);
  }

  return { radius, diameter };
}

// Функция для нахождения центральных и периферийных вершин
function findCentralAndPeripheralVertices(metricMatrix) {
  const { radius, diameter } = findRadiusAndDiameter(metricMatrix);

  const centralVertices = [];
  const peripheralVertices = [];

  for (let i = 0; i < metricMatrix.length; i++) {
    let maxDistance = -Infinity;
    for (let j = 0; j < metricMatrix.length; j++) {
      if (i !== j && metricMatrix[i][j] !== Infinity) {
        maxDistance = Math.max(maxDistance, metricMatrix[i][j]);
      }
    }
    if (maxDistance === radius) {
      peripheralVertices.push(i);
    }
    if (maxDistance === diameter) {
      centralVertices.push(i);
    }
  }

  return { centralVertices, peripheralVertices };
}
