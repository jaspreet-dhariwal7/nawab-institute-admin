const CERTIFICATE_VERIFY_BASE_URL = "https://www.nawabinstitute.in/verify-certificate";
const RESULT_VERIFY_URL = "https://www.nawabinstitute.in/result";
const DEFAULT_ACADEMIC_SESSION = "2026-2027";
const PASS_MARKS = 40;
const ASSETS = {
  certificateBackground: "/certificates/certificate_background.png",
  niteLogo: "/certificates/nite_logo_clean.png",
  isoLogo: "/certificates/iso_certified_logo_clean.png",
  msmeLogo: "/certificates/MSME_logo.png",
};

const NAVY = "#051a48";
const GOLD = "#c98208";
const ORANGE = "#e36900";
const RED = "#ba1717";
const CERTIFICATE_PAPER = "#fffaf2";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const sanitizeFilePart = (value) =>
  String(value || "student")
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "student";

const getGrade = (percentage, passed) => {
  if (!passed) return "Fail";
  if (percentage >= 85) return "A+";
  if (percentage >= 75) return "A";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  return "Fail";
};

const getStableSixDigitNumber = (student) => {
  const source = [
    student.rollNumber,
    student.id,
    student.email,
    student.phone,
    student.name,
    student.admissionDate,
  ]
    .filter(Boolean)
    .join("|");
  const digits = source.replace(/\D/g, "");

  if (digits) return String(Number(digits.slice(-6))).padStart(6, "0");

  const hash = Array.from(source || "certificate").reduce(
    (sum, char) => (sum * 31 + char.charCodeAt(0)) % 1000000,
    0
  );
  return String(hash).padStart(6, "0");
};

const getCertificateNumber = (student) => {
  const existingNumber = student.certificateNumber || student.certificate_no || student.certificate_number;
  if (existingNumber) return String(existingNumber);

  const year = new Date().getFullYear();
  return `NITE/${year}/CA/${getStableSixDigitNumber(student)}`;
};

const getAcademicSession = (student) => {
  const session = String(
    student.academicSession || student.academic_session || student.sessionYear || student.session_year || ""
  ).trim();

  if (/^\d{4}\s*-\s*\d{4}$/.test(session)) return session.replace(/\s+/g, "");
  return DEFAULT_ACADEMIC_SESSION;
};

const getCertificateVerifyUrl = (certificateNumber) =>
  `${CERTIFICATE_VERIFY_BASE_URL}/${encodeURIComponent(certificateNumber)}`;

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error("Missing image source"));
      return;
    }

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

const loadOptionalImage = (src) => loadImage(src).catch(() => null);

const drawImageContain = (ctx, image, x, y, width, height, alpha = 1) => {
  if (!image) return;
  const scale = Math.min(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
  ctx.restore();
};

const drawImageCover = (ctx, image, x, y, width, height, alpha = 1) => {
  if (!image) return;
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
  ctx.restore();
};

const getWrappedLines = (ctx, text, maxWidth, maxLines = 2) => {
  const words = String(text || "-").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const nextLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(nextLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = nextLine;
    }
  });

  if (line) lines.push(line);
  const visibleLines = lines.slice(0, maxLines);
  if (lines.length > maxLines) visibleLines[maxLines - 1] = `${visibleLines[maxLines - 1].replace(/\.*$/, "")}...`;

  return visibleLines.length ? visibleLines : ["-"];
};

const drawWrappedCenteredText = (ctx, text, x, y, maxWidth, lineHeight, maxLines = 2) => {
  const lines = getWrappedLines(ctx, text, maxWidth, maxLines);
  lines.forEach((visibleLine, index) => {
    ctx.fillText(visibleLine, x, y + index * lineHeight);
  });
  return lines;
};

const drawLeftText = (ctx, text, x, y, maxWidth, lineHeight, maxLines = 2) => {
  const words = String(text || "-").split(/\s+/).filter(Boolean);
  let line = "";
  let count = 0;

  words.forEach((word, index) => {
    const nextLine = line ? `${line} ${word}` : word;
    const isLast = index === words.length - 1;
    if (ctx.measureText(nextLine).width > maxWidth && line) {
      if (count >= maxLines - 1) {
        ctx.fillText(`${line.replace(/\.*$/, "")}...`, x, y);
        line = "";
        return;
      }
      ctx.fillText(line, x, y);
      y += lineHeight;
      count += 1;
      line = word;
    } else {
      line = nextLine;
    }

    if (isLast && line) ctx.fillText(line, x, y);
  });
};

const drawPremiumCornerLines = (ctx, width, height) => {
  const margin = 32;
  const cleanSize = 134;
  const corners = [
    { x: margin, y: margin, sx: 1, sy: 1, fill: NAVY, accent: CERTIFICATE_PAPER },
    { x: width - margin, y: margin, sx: -1, sy: 1, fill: CERTIFICATE_PAPER, accent: NAVY },
    { x: margin, y: height - margin, sx: 1, sy: -1, fill: CERTIFICATE_PAPER, accent: NAVY },
    { x: width - margin, y: height - margin, sx: -1, sy: -1, fill: NAVY, accent: CERTIFICATE_PAPER },
  ];

  ctx.save();

  corners.forEach(({ sx, sy, fill }) => {
    ctx.fillStyle = fill;
    ctx.fillRect(
      sx > 0 ? 0 : width - cleanSize,
      sy > 0 ? 0 : height - cleanSize,
      cleanSize,
      cleanSize
    );
  });

  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(-4, 362);
  ctx.quadraticCurveTo(145, 100, 390, -4);
  ctx.moveTo(width + 4, height - 362);
  ctx.quadraticCurveTo(width - 145, height - 100, width - 390, height + 4);
  ctx.stroke();
  ctx.strokeStyle = "#f0bb42";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(2, 340);
  ctx.quadraticCurveTo(144, 112, 365, 2);
  ctx.moveTo(width - 2, height - 340);
  ctx.quadraticCurveTo(width - 144, height - 112, width - 365, height - 2);
  ctx.stroke();

  corners.forEach(({ x, y, sx, sy, accent }) => {
    ctx.strokeStyle = GOLD;
    ctx.lineCap = "square";
    ctx.lineJoin = "miter";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + sx * 150, y);
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + sy * 150);
    ctx.stroke();

    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(x + sx * 18, y + sy * 18);
    ctx.lineTo(x + sx * 126, y + sy * 18);
    ctx.moveTo(x + sx * 18, y + sy * 18);
    ctx.lineTo(x + sx * 18, y + sy * 126);
    ctx.stroke();

    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x + sx * 38, y + sy * 38);
    ctx.lineTo(x + sx * 96, y + sy * 38);
    ctx.moveTo(x + sx * 38, y + sy * 38);
    ctx.lineTo(x + sx * 38, y + sy * 96);
    ctx.stroke();

    ctx.fillStyle = GOLD;
    ctx.fillRect(x + sx * 15 - 4, y + sy * 15 - 4, 8, 8);
  });
  ctx.restore();
};

const drawCertificateCorners = (ctx, width, height) => {
  ctx.save();
  ctx.fillStyle = CERTIFICATE_PAPER;
  ctx.fillRect(0, 0, width, height);
  drawPremiumCornerLines(ctx, width, height);
  ctx.restore();
};

const getDocData = (student, subjects, marks) => {
  const rows = subjects.map((subject, index) => {
    const obtainedMarks = Number(marks[index] || 0);
    return {
      subject,
      totalMarks: 100,
      passMarks: PASS_MARKS,
      obtainedMarks,
    };
  });
  const totalMarks = rows.reduce((sum, row) => sum + row.totalMarks, 0);
  const totalPassMarks = rows.reduce((sum, row) => sum + row.passMarks, 0);
  const obtainedMarks = rows.reduce((sum, row) => sum + row.obtainedMarks, 0);
  const percentage = totalMarks ? Math.round((obtainedMarks / totalMarks) * 100) : 0;
  const passed = rows.length > 0 && rows.every((row) => row.obtainedMarks >= row.passMarks);
  const grade = getGrade(percentage, passed);

  return {
    student,
    rows,
    totalMarks,
    totalPassMarks,
    obtainedMarks,
    percentage,
    passed,
    grade,
    certificateNumber: getCertificateNumber(student),
    issueDate: formatDate(new Date()),
    session: getAcademicSession(student),
  };
};

const gfMul = (x, y) => {
  let result = 0;
  while (y > 0) {
    if (y & 1) result ^= x;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
    y >>= 1;
  }
  return result;
};

const gfPow = (x, power) => {
  let result = 1;
  for (let index = 0; index < power; index += 1) result = gfMul(result, x);
  return result;
};

const rsGenerator = (degree) => {
  let polynomial = [1];
  for (let index = 0; index < degree; index += 1) {
    const next = new Array(polynomial.length + 1).fill(0);
    polynomial.forEach((coefficient, coefficientIndex) => {
      next[coefficientIndex] ^= coefficient;
      next[coefficientIndex + 1] ^= gfMul(coefficient, gfPow(2, index));
    });
    polynomial = next;
  }
  return polynomial;
};

const rsRemainder = (data, degree) => {
  const generator = rsGenerator(degree);
  const result = [...data, ...new Array(degree).fill(0)];
  data.forEach((_value, index) => {
    const coefficient = result[index];
    if (!coefficient) return;
    generator.forEach((generatorCoefficient, generatorIndex) => {
      result[index + generatorIndex] ^= gfMul(generatorCoefficient, coefficient);
    });
  });
  return result.slice(-degree);
};

const getBits = (value, length) => Array.from({ length }, (_item, index) => (value >> (length - 1 - index)) & 1);

const createQrMatrix = (text) => {
  const version = 5;
  const size = 37;
  const dataCodewords = 108;
  const errorCodewords = 26;
  const matrix = Array.from({ length: size }, () => new Array(size).fill(null));
  const reserved = Array.from({ length: size }, () => new Array(size).fill(false));

  const setModule = (x, y, value, isReserved = true) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    matrix[y][x] = value;
    if (isReserved) reserved[y][x] = true;
  };

  const drawFinder = (x, y) => {
    for (let yy = -1; yy <= 7; yy += 1) {
      for (let xx = -1; xx <= 7; xx += 1) {
        const inOuter = xx >= 0 && xx <= 6 && yy >= 0 && yy <= 6;
        const inInner = xx >= 2 && xx <= 4 && yy >= 2 && yy <= 4;
        setModule(x + xx, y + yy, inOuter && (xx === 0 || xx === 6 || yy === 0 || yy === 6 || inInner));
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);

  for (let index = 8; index < size - 8; index += 1) {
    setModule(index, 6, index % 2 === 0);
    setModule(6, index, index % 2 === 0);
  }

  const alignmentCenter = size - 7;
  for (let yy = -2; yy <= 2; yy += 1) {
    for (let xx = -2; xx <= 2; xx += 1) {
      const distance = Math.max(Math.abs(xx), Math.abs(yy));
      setModule(alignmentCenter + xx, alignmentCenter + yy, distance !== 1);
    }
  }

  for (let index = 0; index < 9; index += 1) {
    if (index !== 6) {
      reserved[8][index] = true;
      reserved[index][8] = true;
    }
  }
  for (let index = 0; index < 8; index += 1) {
    reserved[8][size - 1 - index] = true;
    reserved[size - 1 - index][8] = true;
  }
  setModule(8, 4 * version + 9, true);

  const bytes = Array.from(new TextEncoder().encode(text));
  const bits = [...getBits(4, 4), ...getBits(bytes.length, 8), ...bytes.flatMap((byte) => getBits(byte, 8))];
  if (bits.length > dataCodewords * 8) {
    throw new Error("QR payload is too long for the configured certificate QR version.");
  }
  bits.push(...new Array(Math.min(4, dataCodewords * 8 - bits.length)).fill(0));
  while (bits.length % 8) bits.push(0);

  const codewords = [];
  for (let index = 0; index < bits.length; index += 8) {
    codewords.push(bits.slice(index, index + 8).reduce((sum, bit) => (sum << 1) | bit, 0));
  }
  const pads = [0xec, 0x11];
  let padIndex = 0;
  while (codewords.length < dataCodewords) {
    codewords.push(pads[padIndex % 2]);
    padIndex += 1;
  }

  const allCodewords = [...codewords, ...rsRemainder(codewords, errorCodewords)];
  const dataBits = allCodewords.flatMap((codeword) => getBits(codeword, 8));
  let bitIndex = 0;
  let upward = true;

  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right -= 1;
    for (let vertical = 0; vertical < size; vertical += 1) {
      const y = upward ? size - 1 - vertical : vertical;
      for (let offset = 0; offset < 2; offset += 1) {
        const x = right - offset;
        if (!reserved[y][x]) {
          const mask = (x + y) % 2 === 0;
          matrix[y][x] = Boolean(dataBits[bitIndex] ?? 0) !== mask;
          bitIndex += 1;
        }
      }
    }
    upward = !upward;
  }

  const formatValue = (1 << 3) | 0;
  let formatBits = formatValue << 10;
  for (let index = 14; index >= 10; index -= 1) {
    if ((formatBits >> index) & 1) formatBits ^= 0x537 << (index - 10);
  }
  const finalFormat = ((formatValue << 10) | formatBits) ^ 0x5412;
  const format = getBits(finalFormat, 15);
  const a = [[8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8], [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]];
  const b = [[size - 1, 8], [size - 2, 8], [size - 3, 8], [size - 4, 8], [size - 5, 8], [size - 6, 8], [size - 7, 8], [8, size - 8], [8, size - 7], [8, size - 6], [8, size - 5], [8, size - 4], [8, size - 3], [8, size - 2], [8, size - 1]];
  format.forEach((bit, index) => {
    setModule(a[index][0], a[index][1], Boolean(bit));
    setModule(b[index][0], b[index][1], Boolean(bit));
  });

  return matrix.map((row) => row.map(Boolean));
};

const drawQr = (ctx, text, x, y, size) => {
  const matrix = createQrMatrix(text);
  const quiet = 4;
  const moduleSize = size / (matrix.length + quiet * 2);

  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = "#000000";
  matrix.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      if (value) {
        ctx.fillRect(
          x + (colIndex + quiet) * moduleSize,
          y + (rowIndex + quiet) * moduleSize,
          Math.ceil(moduleSize),
          Math.ceil(moduleSize)
        );
      }
    });
  });
  ctx.restore();
};

const canvasToPdf = (canvas, fileName, orientation) => {
  const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
  const imageData = atob(dataUrl.split(",")[1]);
  const page = orientation === "landscape" ? { width: 842, height: 595 } : { width: 595, height: 842 };
  const contentStream = `q ${page.width} 0 0 ${page.height} 0 0 cm /Im0 Do Q`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${page.width} ${page.height}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`,
    `<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageData.length} >>\nstream\n${imageData}\nendstream`,
    `<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`,
  ];
  let pdf = "%PDF-1.3\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  const bytes = Uint8Array.from(pdf, (char) => char.charCodeAt(0));
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
};

const drawSignature = (ctx, x, y, name, title, color = NAVY) => {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 70, y - 18);
  ctx.bezierCurveTo(x - 28, y - 64, x - 20, y + 18, x + 18, y - 30);
  ctx.bezierCurveTo(x + 38, y - 55, x + 48, y + 3, x + 82, y - 34);
  ctx.stroke();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 105, y + 14);
  ctx.lineTo(x + 105, y + 14);
  ctx.stroke();
  ctx.fillStyle = NAVY;
  ctx.font = "32px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText(name, x, y + 52);
  ctx.fillStyle = GOLD;
  ctx.font = "24px Georgia, serif";
  ctx.fillText(title, x, y + 85);
  ctx.restore();
};

const drawCertificateInfoBox = (ctx, x, y, label, value) => {
  const width = 260;
  const height = 96;
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.fillStyle = "rgba(255, 250, 242, 0.78)";
  ctx.lineWidth = 3;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 10, y + 10, width - 20, height - 20);
  ctx.textAlign = "center";
  ctx.fillStyle = NAVY;
  ctx.font = "26px Georgia, 'Times New Roman', serif";
  ctx.fillText(label, x + width / 2, y + 39);
  ctx.fillStyle = RED;
  let valueSize = 21;
  do {
    ctx.font = `bold ${valueSize}px Arial, sans-serif`;
    if (ctx.measureText(String(value || "-")).width <= width - 38 || valueSize <= 16) break;
    valueSize -= 1;
  } while (valueSize >= 16);
  ctx.fillText(value, x + width / 2, y + 70);
  ctx.restore();
};

const formatCertificateCourse = (courseName) => {
  const course = String(courseName || "-").trim();
  if (!course || course === "-") return "-";
  return /^diploma\s+in\s+/i.test(course) ? course.toUpperCase() : `DIPLOMA IN ${course.toUpperCase()}`;
};

const drawCertificateSignature = (ctx, x, y, name, title, color = NAVY) => {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 70, y - 8);
  ctx.bezierCurveTo(x - 46, y - 62, x - 22, y + 12, x + 8, y - 42);
  ctx.bezierCurveTo(x + 34, y - 78, x + 42, y + 6, x + 90, y - 30);
  ctx.stroke();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 115, y + 28);
  ctx.lineTo(x + 115, y + 28);
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = NAVY;
  ctx.font = "30px Georgia, 'Times New Roman', serif";
  ctx.fillText(name, x, y + 65);
  ctx.fillStyle = RED;
  ctx.font = "26px Georgia, 'Times New Roman', serif";
  ctx.fillText(title, x, y + 101);
  ctx.restore();
};

const drawFittedCenteredText = (ctx, text, x, y, maxWidth, fontTemplate, startSize, minSize = 42) => {
  const value = String(text || "-");
  let size = startSize;
  do {
    ctx.font = fontTemplate(size);
    if (ctx.measureText(value).width <= maxWidth || size <= minSize) break;
    size -= 2;
  } while (size >= minSize);
  ctx.fillText(value, x, y);
};

const drawCertificateDetailsRow = (ctx, data, student, centerX, y) => {
  const items = [
    { label: "Roll No.:", value: student.rollNumber || "-" },
    { label: "With Grade", value: `${data.grade} (${data.percentage}%)`, valueColor: GOLD },
    { label: "Session:", value: data.session },
  ];
  const separator = "|";
  const gap = 24;
  const labelFont = "30px Georgia, 'Times New Roman', serif";
  const valueFont = "bold 30px Arial, sans-serif";
  const separatorFont = "34px Georgia, 'Times New Roman', serif";

  ctx.save();
  const parts = [];
  items.forEach((item, index) => {
    ctx.font = labelFont;
    parts.push({ text: item.label, font: labelFont, color: NAVY, width: ctx.measureText(item.label).width });
    ctx.font = valueFont;
    parts.push({ text: item.value, font: valueFont, color: item.valueColor || NAVY, width: ctx.measureText(item.value).width });
    if (index < items.length - 1) {
      ctx.font = separatorFont;
      parts.push({ text: separator, font: separatorFont, color: GOLD, width: ctx.measureText(separator).width });
    }
  });

  const totalWidth = parts.reduce((sum, part) => sum + part.width, 0) + gap * (parts.length - 1);
  let x = centerX - totalWidth / 2;
  ctx.textAlign = "left";
  parts.forEach((part, index) => {
    ctx.font = part.font;
    ctx.fillStyle = part.color;
    ctx.fillText(part.text, x, y);
    x += part.width + (index < parts.length - 1 ? gap : 0);
  });
  ctx.restore();
};

const drawHeader = (ctx, width, niteLogo, isoLogo, compact = false) => {
  const logoSize = compact ? 165 : 190;
  const headerTop = compact ? 70 : 95;
  drawImageContain(ctx, niteLogo, compact ? 92 : 230, headerTop, logoSize, logoSize);
  ctx.fillStyle = NAVY;
  ctx.textAlign = "center";
  ctx.font = `${compact ? 43 : 66}px Georgia, 'Times New Roman', serif`;
  ctx.fillText("NAWAB INSTITUTE OF", width / 2, compact ? 130 : 120);
  ctx.fillText("TECHNICAL EDUCATION", width / 2, compact ? 184 : 190);
  ctx.fillStyle = ORANGE;
  ctx.font = `${compact ? 21 : 30}px Arial, sans-serif`;
  ctx.fillText("(AN ISO 9001:2015 CERTIFIED INSTITUTION)", width / 2, compact ? 232 : 235);
  ctx.fillStyle = NAVY;
  ctx.font = `${compact ? 20 : 28}px Arial, sans-serif`;
  ctx.fillText("NITE is an Education Organization (Since 2026)", width / 2, compact ? 276 : 285);
  ctx.fillText("Opp. Petrol Pump, Adda Udhanwal-143505 (PB.)", width / 2, compact ? 312 : 325);
  drawImageContain(ctx, isoLogo, compact ? width - 250 : width - 330, compact ? 84 : 85, compact ? 160 : 230, compact ? 160 : 230);

  if (compact) {
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(110, 360);
    ctx.lineTo(width - 110, 360);
    ctx.stroke();
  }
};

export const downloadCertificatePdf = async ({ student, subjects, marks }) => {
  const data = getDocData(student, subjects, marks);
  const canvas = document.createElement("canvas");
  canvas.width = 1684;
  canvas.height = 1190;
  const ctx = canvas.getContext("2d");
  const [certificateBackground, niteLogo, isoLogo] = await Promise.all([
    loadOptionalImage(ASSETS.certificateBackground),
    loadOptionalImage(ASSETS.niteLogo),
    loadOptionalImage(ASSETS.isoLogo),
  ]);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (certificateBackground) {
    drawImageCover(ctx, certificateBackground, 0, 0, canvas.width, canvas.height);
  } else {
    drawCertificateCorners(ctx, canvas.width, canvas.height);
  }

  drawImageContain(ctx, niteLogo, 165, 125, 275, 275);
  drawImageContain(ctx, isoLogo, 1300, 120, 230, 230);

  ctx.textAlign = "center";
  ctx.fillStyle = NAVY;
  ctx.font = "bold 56px Georgia, 'Times New Roman', serif";
  ctx.fillText("NAWAB INSTITUTE OF", canvas.width / 2, 188);
  ctx.fillText("TECHNICAL EDUCATION", canvas.width / 2, 252);
  ctx.fillStyle = RED;
  ctx.font = "31px Arial, sans-serif";
  ctx.fillText("(AN ISO 9001:2015 CERTIFIED INSTITUTION)", canvas.width / 2, 306);
  ctx.fillStyle = NAVY;
  ctx.font = "27px Georgia, 'Times New Roman', serif";
  ctx.fillText("NITE is an Education Organization (Since 2026)", canvas.width / 2, 360);
  ctx.fillText("Opp. Petrol Pump, Adda Udhanwal-143505 (PB.)", canvas.width / 2, 402);

  drawCertificateInfoBox(ctx, 135, 472, "Certificate No.", data.certificateNumber);
  drawCertificateInfoBox(ctx, canvas.width - 395, 472, "Issue Date", data.issueDate);

  if (niteLogo) drawImageContain(ctx, niteLogo, 560, 640, 560, 390, 0.035);

  ctx.fillStyle = NAVY;
  ctx.font = "bold 58px Georgia, 'Times New Roman', serif";
  ctx.fillText("DIPLOMA CERTIFICATE", canvas.width / 2, 555);
  ctx.fillStyle = GOLD;
  ctx.font = "bold 41px Georgia, 'Times New Roman', serif";
  ctx.fillText("IN", canvas.width / 2, 612);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(615, 605);
  ctx.lineTo(790, 605);
  ctx.moveTo(894, 605);
  ctx.lineTo(1069, 605);
  ctx.stroke();

  ctx.fillStyle = NAVY;
  ctx.font = "bold 36px Georgia, 'Times New Roman', serif";
  const courseY = 655;
  const courseLineHeight = 44;
  const courseLines = drawWrappedCenteredText(
    ctx,
    formatCertificateCourse(student.courseName),
    canvas.width / 2,
    courseY,
    860,
    courseLineHeight,
    2
  );
  const awardedToY = courseY + (courseLines.length - 1) * courseLineHeight + 54;
  ctx.font = "italic 30px Georgia, 'Times New Roman', serif";
  ctx.fillText("Awarded to", canvas.width / 2, awardedToY);
  ctx.fillStyle = NAVY;
  const studentNameY = awardedToY + 78;
  drawFittedCenteredText(
    ctx,
    student.name || "-",
    canvas.width / 2,
    studentNameY,
    780,
    (size) => `bold ${size}px 'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif`,
    66,
    54
  );
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(450, studentNameY + 30);
  ctx.lineTo(1234, studentNameY + 30);
  ctx.stroke();

  drawCertificateDetailsRow(ctx, data, student, canvas.width / 2, studentNameY + 90);

  drawCertificateSignature(ctx, 440, 990, "Mandeep Singh", "Director");
  drawCertificateSignature(ctx, 1245, 990, "Navjot Singh", "Principal", "#123bff");
  drawQr(ctx, getCertificateVerifyUrl(data.certificateNumber), canvas.width / 2 - 60, 950, 120);
  ctx.fillStyle = NAVY;
  ctx.font = "18px Arial, sans-serif";
  ctx.fillText("Scan to Verify", canvas.width / 2, 1130);

  canvasToPdf(canvas, `certificate-${sanitizeFilePart(student.rollNumber || student.name)}.pdf`, "landscape");
};

export const downloadDmcPdf = async ({ student, subjects, marks }) => {
  const data = getDocData(student, subjects, marks);
  const canvas = document.createElement("canvas");
  canvas.width = 1190;
  canvas.height = 1684;
  const ctx = canvas.getContext("2d");
  const [certificateBackground, niteLogo, isoLogo, msmeLogo, studentPhoto] = await Promise.all([
    loadOptionalImage(ASSETS.certificateBackground),
    loadOptionalImage(ASSETS.niteLogo),
    loadOptionalImage(ASSETS.isoLogo),
    loadOptionalImage(ASSETS.msmeLogo),
    loadOptionalImage(student.photoUrl),
  ]);

  ctx.fillStyle = CERTIFICATE_PAPER;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (certificateBackground) {
    drawImageCover(ctx, certificateBackground, 0, 0, canvas.width, canvas.height, 0.12);
  }
  drawHeader(ctx, canvas.width, niteLogo, isoLogo, true);
  drawImageContain(ctx, niteLogo, 345, 600, 500, 480, 0.035);

  ctx.fillStyle = NAVY;
  ctx.font = "bold 46px Georgia, 'Times New Roman', serif";
  ctx.textAlign = "center";
  ctx.fillText("ACADEMIC TRANSCRIPT", canvas.width / 2, 435);
  ctx.font = "27px Georgia, serif";
  ctx.fillText("DETAILED MARKS CARD (DMC)", canvas.width / 2, 478);

  if (studentPhoto) {
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2;
    ctx.fillRect(910, 542, 138, 174);
    ctx.strokeRect(910, 542, 138, 174);
    drawImageCover(ctx, studentPhoto, 918, 550, 122, 158);
  }

  const rows = [
    ["Roll No.", student.rollNumber],
    ["Name", student.name],
    ["Father's Name", student.fatherName],
    ["Date of Birth", formatDate(student.dob)],
    ["Award", student.courseName],
    ["Course Duration", data.session],
    ["Grade", data.grade],
    ["Result", data.passed ? "PASS" : "FAIL"],
  ];
  ctx.textAlign = "left";
  ctx.strokeStyle = "rgba(201, 130, 8, 0.55)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(105, 525, 780, 365);
  rows.forEach(([label, value], index) => {
    const y = 572 + index * 40;
    ctx.fillStyle = NAVY;
    ctx.font = "bold 22px Georgia, serif";
    ctx.fillText(label, 130, y);
    ctx.fillText(":", 325, y);
    ctx.fillStyle = "#171717";
    ctx.font = index === 4 ? "20px Georgia, serif" : "22px Georgia, serif";
    drawLeftText(ctx, value || "-", 350, y, 500, 25, index === 4 ? 2 : 1);
  });

  ctx.textAlign = "center";
  ctx.fillStyle = NAVY;
  ctx.font = "bold 32px Georgia, serif";
  ctx.fillText("STATEMENT OF MARKS", canvas.width / 2, 930);

  const tableX = 80;
  const tableY = 960;
  const colWidths = [430, 190, 190, 220];
  const rowHeight = 44;
  const headers = ["SUBJECTS", "MAX MARKS", "PASS MARKS", "MARKS OBTAINED"];
  ctx.fillStyle = NAVY;
  ctx.fillRect(tableX, tableY, colWidths.reduce((sum, width) => sum + width, 0), rowHeight);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  let x = tableX;
  headers.forEach((header, index) => {
    ctx.strokeRect(x, tableY, colWidths[index], rowHeight);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 19px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(header, x + colWidths[index] / 2, tableY + 29);
    x += colWidths[index];
  });

  const visibleRows = data.rows.slice(0, 8);
  visibleRows.forEach((row, rowIndex) => {
    const y = tableY + rowHeight * (rowIndex + 1);
    ctx.fillStyle = rowIndex % 2 === 0 ? "rgba(255, 255, 255, 0.86)" : "rgba(255, 250, 242, 0.86)";
    ctx.fillRect(tableX, y, colWidths.reduce((sum, width) => sum + width, 0), rowHeight);
    ctx.strokeStyle = "rgba(5, 26, 72, 0.65)";
    ctx.lineWidth = 1;
    x = tableX;
    [row.subject, row.totalMarks, row.passMarks, row.obtainedMarks].forEach((value, index) => {
      ctx.strokeRect(x, y, colWidths[index], rowHeight);
      ctx.fillStyle = "#111111";
      ctx.font = "20px Georgia, serif";
      ctx.textAlign = index === 0 ? "left" : "center";
      const textX = index === 0 ? x + 18 : x + colWidths[index] / 2;
      if (index === 0) {
        drawLeftText(ctx, String(value || "-").toUpperCase(), textX, y + 27, colWidths[index] - 32, 20, 1);
      } else {
        ctx.fillText(String(value || "-").toUpperCase(), textX, y + 28);
      }
      x += colWidths[index];
    });
  });

  const totalY = tableY + rowHeight * (visibleRows.length + 1);
  ctx.fillStyle = "rgba(255, 250, 242, 0.96)";
  ctx.fillRect(tableX, totalY, colWidths.reduce((sum, width) => sum + width, 0), rowHeight);
  x = tableX;
  ["TOTAL MARKS", data.totalMarks, data.totalPassMarks, data.obtainedMarks].forEach((value, index) => {
    ctx.strokeStyle = NAVY;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, totalY, colWidths[index], rowHeight);
    ctx.fillStyle = NAVY;
    ctx.font = "bold 22px Georgia, serif";
    ctx.textAlign = index === 0 ? "left" : "center";
    ctx.fillText(String(value), index === 0 ? x + 18 : x + colWidths[index] / 2, totalY + 29);
    x += colWidths[index];
  });

  ctx.fillStyle = NAVY;
  ctx.font = "bold 22px Georgia, serif";
  ctx.textAlign = "left";
  ctx.fillText("Dated:", 95, 1450);
  ctx.fillStyle = "#111111";
  ctx.font = "22px Georgia, serif";
  ctx.fillText(formatDate(new Date()), 170, 1450);

  drawQr(ctx, RESULT_VERIFY_URL, canvas.width / 2 - 62, 1378, 124);
  ctx.fillStyle = NAVY;
  ctx.font = "18px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Scan to Verify", canvas.width / 2, 1527);
  drawSignature(ctx, 910, 1435, "Mandeep", "Director", "#123bff");
  drawImageContain(ctx, msmeLogo, 828, 1510, 165, 86);

  ctx.fillStyle = NAVY;
  ctx.font = "18px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Call at Helpline No.: Off.: 98763-12949, 62809-95745", canvas.width / 2, 1608);
  ctx.fillText("nawabinstitute.in   |   Email: nawab2025@nawabinstitute.com", canvas.width / 2, 1640);

  canvasToPdf(canvas, `dmc-${sanitizeFilePart(student.rollNumber || student.name)}.pdf`, "portrait");
};
