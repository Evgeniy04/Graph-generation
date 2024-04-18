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

  let adjacencyMatrix = fullGraph
    ? generateAdjacencyMatrixOfCompleteGraph(dimension)
    : generateAdjacencyMatrix(dimension);

  // Параметр, определяющий тип графа (true - ориентированный, false - неориентированный)
  isDirected = determineGraphType(adjacencyMatrix);

  // Добавляем к матрице кратные рёбра и/или петли
  adjacencyMatrix = multipleEdgeGraph
    ? addMultipleEdges(adjacencyMatrix)
    : adjacencyMatrix;
  adjacencyMatrix = loopsGraph ? addLoops(adjacencyMatrix) : adjacencyMatrix;

  // Делаем кнопки показа матриц видимыми
  document
    .querySelector('button[data-bs-target="#showAdjacencyMatrixModal"]')
    .classList.remove("d-none");
  document
    .querySelector('button[data-bs-target="#showIncidenceMatrixModal"]')
    .classList.remove("d-none");

  // Отображение матрицы смежности
  let theadAdjacencyMatrix = adjacencyMatrix
    .map((_, i) => `<th scope="col">${i}</th>`)
    .join("");
  let contentAdjacencyMatrix = "";
  for (let i = 0; i < dimension; i++) {
    contentAdjacencyMatrix += `<tr><th scope="row">${i}</th>`;
    for (let j = 0; j < dimension; j++) {
      contentAdjacencyMatrix += `<td>${adjacencyMatrix[i][j]}</td>`;
    }
    contentAdjacencyMatrix += `</tr>`;
  }
  let tableAdjacencyMatrix = document.querySelector(
    "#showAdjacencyMatrixModal table.table"
  );
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
    // Если граф ориентированный, то рассматриваем все пересечения с другим элементом построчно
    // Если граф неориентированный, то смотрим только главную диагональ матрицы и под ней
    let lim = isDirected ? dimension : i + 1;
    for (let j = 0; j < lim; j++) {
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
  let theadIncidenceMatrix = edges
    .map((v) => `<th scope="col">${v.label}</th>`)
    .join("");
  let contentIncidenceMatrix = "";
  for (let i = 0; i < dimension; i++) {
    contentIncidenceMatrix += `<tr><th scope="row">${i}</th>`;
    for (let j = 0; j < edges.length; j++) {
      contentIncidenceMatrix += `<td>${incidenceMatrix[i][j]}</td>`;
    }
    contentIncidenceMatrix += `</tr>`;
  }
  let tableIncidenceMatrix = document.querySelector(
    "#showIncidenceMatrixModal table.table"
  );
  tableIncidenceMatrix.innerHTML = `<thead>
        <tr>
            <th scope="col">Вершина/Ребро</th>
            ${theadIncidenceMatrix}
        </tr>
        </thead>
        <tbody>
        ${contentIncidenceMatrix}
        </tbody>`;
}

// Генерация матрицы смежности ориентированного графа без петель и кратных рёбер
function generateAdjacencyMatrix(n) {
  const matrix = new Array(n)
    .fill(0)
    .map((_, i) =>
      [...Array(n)].map((_, j) => (i === j ? 0 : Math.round(Math.random())))
    );

  return matrix;
}
// Генерация матрицы смежности полного графа без петель и кратных рёбер
function generateAdjacencyMatrixOfCompleteGraph(n) {
  const matrix = new Array(n)
    .fill(0)
    .map((_, i) => [...Array(n)].map((_, j) => (i === j ? 0 : 1)));

  return matrix;
}
// Добавить кратные рёбра
function addMultipleEdges(matrix) {
  for (let i = 0; i < matrix.length; i++) {
    let lim = isDirected ? matrix.length : i + 1;
    for (let j = 0; j < lim; j++) {
      const count = matrix[i][j];
      if (count <= 0) continue;
      let randomNumber = Math.round(Math.random()) + 1;
      matrix[i][j] = randomNumber;
      matrix[j][i] = isDirected ? matrix[j][i] : randomNumber;
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
  const incidenceMatrix = [];
  for (let j = 0; j < matrix.length; j++) {
    incidenceMatrix.push([]);
    for (let i = 0; i < edges.length; i++) {
      // Если у вершины есть пересечение с каким-либо ребром, значит 1
      if (edges[i].from === j || edges[i].to === j) {
        incidenceMatrix[j].push(1);
      } else {
        incidenceMatrix[j].push(0);
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
