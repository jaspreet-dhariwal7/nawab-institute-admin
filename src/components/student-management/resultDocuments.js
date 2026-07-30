const RESULT_VERIFY_URL = "https://www.nawabinstitute.in/result";
const DEFAULT_ACADEMIC_SESSION = "2026-2027";
const PASS_MARKS = 40;
const ASSETS = {
  certificateBackground: "/certificates/certificate_background_minimal.png",
  dmcBackground: "/certificates/certificate_background_borderless.png",
  niteLogo: "/certificates/nite_logo_clean.png",
  isoLogo: "/certificates/iso_certified_logo_clean.png",
  msmeLogo: "/certificates/MSME_logo.png",
  niteRedSeal: "/certificates/nite_red_seal.png",
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
  // Version 3-L uses a single Reed-Solomon block, so no block interleaving is required.
  const version = 3;
  const size = 29;
  const dataCodewords = 55;
  const errorCodewords = 15;
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
  const format = getBits(finalFormat, 15).reverse();
  const a = [[8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8], [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]];
  const b = [[size - 1, 8], [size - 2, 8], [size - 3, 8], [size - 4, 8], [size - 5, 8], [size - 6, 8], [size - 7, 8], [size - 8, 8], [8, size - 7], [8, size - 6], [8, size - 5], [8, size - 4], [8, size - 3], [8, size - 2], [8, size - 1]];
  format.forEach((bit, index) => {
    setModule(a[index][0], a[index][1], Boolean(bit));
    setModule(b[index][0], b[index][1], Boolean(bit));
  });

  return matrix.map((row) => row.map(Boolean));
};

const drawQr = (ctx, text, x, y, size) => {
  const matrix = createQrMatrix(text);
  const quiet = 4;
  const moduleSize = Math.max(1, Math.floor(size / (matrix.length + quiet * 2)));
  const qrSize = moduleSize * (matrix.length + quiet * 2);
  const offsetX = x + (size - qrSize) / 2;
  const offsetY = y + (size - qrSize) / 2;

  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = "#000000";
  matrix.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      if (value) {
        ctx.fillRect(
          offsetX + (colIndex + quiet) * moduleSize,
          offsetY + (rowIndex + quiet) * moduleSize,
          moduleSize,
          moduleSize
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

const drawSignature = (ctx, x, y, name, title) => {
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 105, y + 14);
  ctx.lineTo(x + 105, y + 14);
  ctx.stroke();
  ctx.fillStyle = NAVY;
  ctx.font = "22px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText(name, x, y + 52);
  ctx.fillStyle = GOLD;
  ctx.font = "16px Georgia, serif";
  ctx.fillText(title, x, y + 85);
  ctx.restore();
};

const drawCertificateNumberBox = (ctx, x, y, width, certificateNumber) => {
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = GOLD;
  ctx.font = "bold 13px Arial, sans-serif";
  ctx.fillText("CERTIFICATE NO.", x + width / 2, y + 24);
  ctx.fillStyle = NAVY;
  ctx.font = "bold 18px Arial, sans-serif";
  ctx.fillText(certificateNumber || "-", x + width / 2, y + 53);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + 66);
  ctx.lineTo(x + width, y + 66);
  ctx.stroke();
  ctx.restore();
};

const drawCertificateInnerBorder = (ctx, width, height) => {
  const margin = 58;
  ctx.save();
  ctx.strokeStyle = "rgba(201, 130, 8, 0.78)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(405, margin);
  ctx.lineTo(width - margin, margin);
  ctx.lineTo(width - margin, 690);
  ctx.moveTo(margin, height - margin);
  ctx.lineTo(1180, height - margin);
  ctx.moveTo(margin, height - margin);
  ctx.lineTo(margin, 365);
  ctx.stroke();
  ctx.restore();
};

const formatCertificateCourse = (courseName) => {
  const course = String(courseName || "-").trim();
  if (!course || course === "-") return "-";
  return course.replace(/^(?:diploma|certificate)\s+in\s+/i, "").toUpperCase();
};

const formatCourseDuration = (duration) => {
  const value = String(duration || "").trim();
  if (!value) return "-";
  const months = value.match(/^(\d+(?:\.\d+)?)\s*(?:months?)?$/i);
  if (months) {
    const count = Number(months[1]);
    return `${count} ${count === 1 ? "Month" : "Months"}`;
  }
  return /months?$/i.test(value) ? value : `${value} Months`;
};

const formatCertificateDuration = (duration) => {
  const value = String(duration || "").trim();
  if (!value) return "-";
  return value.replace(/\s*months?\s*$/i, "").trim() || "-";
};

const formatCertificateDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return [
    String(date.getDate()).padStart(2, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    date.getFullYear(),
  ].join("-");
};

const getCertificateCompletionDate = (student) => {
  const explicitDate =
    student.courseCompletionDate ||
    student.course_completion_date ||
    student.completionDate ||
    student.completion_date ||
    student.endDate ||
    student.end_date;

  if (explicitDate) return explicitDate;

  const monthMatch = String(student.courseDuration || "").match(/(\d+(?:\.\d+)?)/);
  const monthCount = monthMatch ? Number(monthMatch[1]) : 0;
  const startDate = new Date(student.admissionDate);
  if (!Number.isInteger(monthCount) || monthCount <= 0 || Number.isNaN(startDate.getTime())) return "";

  const originalDay = startDate.getDate();
  const completionDate = new Date(startDate);
  completionDate.setDate(1);
  completionDate.setMonth(completionDate.getMonth() + monthCount);
  const lastDayOfTargetMonth = new Date(
    completionDate.getFullYear(),
    completionDate.getMonth() + 1,
    0
  ).getDate();
  completionDate.setDate(Math.min(originalDay, lastDayOfTargetMonth));
  completionDate.setDate(completionDate.getDate() - 1);
  return completionDate;
};

const getFittedFont = (ctx, text, fontTemplate, maxWidth, startSize, minSize = 18) => {
  let size = startSize;
  do {
    ctx.font = fontTemplate(size);
    if (ctx.measureText(String(text || "-")).width <= maxWidth || size <= minSize) break;
    size -= 1;
  } while (size >= minSize);
  return ctx.font;
};

const drawDottedValue = (
  ctx,
  value,
  startX,
  endX,
  y,
  {
    startSize = 25,
    minSize = 18,
    bold = false,
    underline = true,
    align = "center",
    textPadding = 0,
  } = {}
) => {
  const text = String(value || "-");
  const availableWidth = Math.max(0, endX - startX);
  const fontTemplate = (size) =>
    `${bold ? "bold " : ""}${size}px 'Courier New', Courier, monospace`;

  ctx.save();
  getFittedFont(
    ctx,
    text,
    fontTemplate,
    Math.max(0, availableWidth - textPadding * 2),
    startSize,
    minSize
  );
  const textWidth = ctx.measureText(text).width;
  const textX =
    align === "left"
      ? startX + textPadding
      : startX + (availableWidth - textWidth) / 2;
  const underlineY = y + 8;

  if (underline) {
    ctx.strokeStyle = "#202020";
    ctx.lineWidth = 2;
    ctx.setLineDash([2, 6]);
    ctx.beginPath();
    ctx.moveTo(startX, underlineY);
    ctx.lineTo(endX, underlineY);
    ctx.stroke();
  }

  ctx.setLineDash([]);
  ctx.fillStyle = "#111111";
  ctx.textAlign = "left";
  ctx.fillText(text, textX, y);
  ctx.restore();
};

const drawLabeledCertificateRow = (ctx, label, value, x, endX, y) => {
  ctx.save();
  ctx.fillStyle = "#111111";
  ctx.textAlign = "left";
  ctx.font = "25px Arial, sans-serif";
  ctx.fillText(label, x, y);
  const valueStartX = x + ctx.measureText(label).width + 12;
  ctx.restore();
  drawDottedValue(ctx, value, valueStartX, endX, y, {
    startSize: 29,
    minSize: 20,
    bold: true,
    align: "left",
    textPadding: 18,
  });
};

const drawCertificateSignature = (ctx, x, y, name, title) => {
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 115, y + 28);
  ctx.lineTo(x + 115, y + 28);
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = NAVY;
  ctx.font = "22px Georgia, 'Times New Roman', serif";
  ctx.fillText(name, x, y + 65);
  ctx.fillStyle = RED;
  ctx.font = "16px Georgia, 'Times New Roman', serif";
  ctx.fillText(title, x, y + 101);
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
  ctx.fillText("ISO 9001:2015 CERTIFIED INSTITUTION", width / 2, compact ? 232 : 235);
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

export const renderCertificateCanvas = async ({ student, subjects, marks }) => {
  if (document.fonts) {
    await document.fonts.load("65px 'Chomsky'");
  }

  const data = getDocData(student, subjects, marks);
  const canvas = document.createElement("canvas");
  canvas.width = 1684;
  canvas.height = 1190;
  const ctx = canvas.getContext("2d");
  const [certificateBackground, niteLogo, isoLogo, niteRedSeal] = await Promise.all([
    loadOptionalImage(ASSETS.certificateBackground),
    loadOptionalImage(ASSETS.niteLogo),
    loadOptionalImage(ASSETS.isoLogo),
    loadOptionalImage(ASSETS.niteRedSeal),
  ]);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (certificateBackground) {
    drawImageCover(ctx, certificateBackground, 0, 0, canvas.width, canvas.height);
  } else {
    drawCertificateCorners(ctx, canvas.width, canvas.height);
  }
  drawCertificateInnerBorder(ctx, canvas.width, canvas.height);

  drawImageContain(ctx, niteLogo, 175, 98, 215, 215);
  const certificateNumberX = 1330;
  const certificateNumberY = 70;
  const certificateNumberWidth = 270;
  const certificateNumberCenterX = certificateNumberX + certificateNumberWidth / 2;
  drawCertificateNumberBox(
    ctx,
    certificateNumberX,
    certificateNumberY,
    certificateNumberWidth,
    data.certificateNumber
  );
  drawQr(ctx, RESULT_VERIFY_URL, certificateNumberCenterX - 52, 158, 104);
  ctx.save();
  ctx.fillStyle = NAVY;
  ctx.textAlign = "center";
  ctx.font = "12px Arial, sans-serif";
  ctx.fillText("For more details and Diploma Verification:", certificateNumberCenterX, 279);
  ctx.fillText("www.nawabinstitute.in or scan QR Code", certificateNumberCenterX, 296);
  ctx.restore();

  ctx.textAlign = "center";
  ctx.fillStyle = NAVY;
  ctx.font = "bold 52px Georgia, 'Times New Roman', serif";
  ctx.fillText("NAWAB INSTITUTE OF", canvas.width / 2, 165);
  ctx.fillText("TECHNICAL EDUCATION", canvas.width / 2, 223);
  ctx.fillStyle = RED;
  ctx.font = "24px Arial, sans-serif";
  ctx.fillText("CERTIFIED INTERNATIONAL STANDARDS ORGANIZATION", canvas.width / 2, 273);
  ctx.fillText("ISO 9001:2015", canvas.width / 2, 309);

  if (niteLogo) {
    const watermarkSize = 750;
    drawImageContain(
      ctx,
      niteLogo,
      (canvas.width - watermarkSize) / 2,
      (canvas.height - watermarkSize) / 2,
      watermarkSize,
      watermarkSize,
      0.04
    );
  }

  const contentLeft = 185;
  const contentRight = 1510;
  const courseName = formatCertificateCourse(student.courseName);
  const completionDate = getCertificateCompletionDate(student);

  ctx.fillStyle = "#111111";
  ctx.font = "65px 'Chomsky', 'Old English Text MT', 'Cloister Black', Georgia, serif";
  ctx.fillText("Honour’s Diploma", canvas.width / 2, 402);
  ctx.font = "bold 24px Arial, sans-serif";
  ctx.fillText("IN", canvas.width / 2, 452);
  drawDottedValue(ctx, courseName, 560, 1124, 500, {
    startSize: 35,
    minSize: 24,
    bold: true,
    underline: false,
  });

  drawLabeledCertificateRow(
    ctx,
    "Certified that Mrs./Mr./Smt./Shri.",
    student.name,
    contentLeft,
    contentRight,
    584
  );
  drawLabeledCertificateRow(
    ctx,
    "Son/Daughter/Wife of Smt./Shri.",
    student.fatherName || student.guardianName,
    contentLeft,
    contentRight,
    648
  );
  drawLabeledCertificateRow(ctx, "Resident of", student.address, contentLeft, contentRight, 712);

  ctx.save();
  ctx.fillStyle = "#111111";
  ctx.textAlign = "left";
  ctx.font = "25px Arial, sans-serif";
  const durationLabel = "Has undergone";
  ctx.fillText(durationLabel, contentLeft, 780);
  const durationStartX = contentLeft + ctx.measureText(durationLabel).width + 10;
  const durationEndX = durationStartX + 175;
  drawDottedValue(
    ctx,
    formatCertificateDuration(student.courseDuration),
    durationStartX,
    durationEndX,
    780,
    {
      startSize: 29,
      minSize: 20,
      bold: true,
      align: "left",
      textPadding: 18,
    }
  );
  const courseLabel = "Months Diploma/Certificate Course in";
  const courseLabelX = durationEndX + 14;
  ctx.fillText(courseLabel, courseLabelX, 780);
  const courseStartX = courseLabelX + ctx.measureText(courseLabel).width + 10;
  ctx.restore();

  drawDottedValue(ctx, courseName, courseStartX, contentRight, 780, {
    startSize: 29,
    minSize: 20,
    bold: true,
    align: "left",
    textPadding: 18,
  });

  ctx.save();
  ctx.fillStyle = "#111111";
  ctx.textAlign = "left";
  ctx.font = "25px Arial, sans-serif";
  const dateLabel = "Imparted by the institution from";
  ctx.fillText(dateLabel, contentLeft, 850);
  const fromStartX = contentLeft + ctx.measureText(dateLabel).width + 10;
  const fromEndX = fromStartX + 260;
  drawDottedValue(
    ctx,
    formatCertificateDate(student.admissionDate),
    fromStartX,
    fromEndX,
    850,
    {
      startSize: 27,
      minSize: 20,
      bold: true,
      align: "left",
      textPadding: 18,
    }
  );
  ctx.fillText("to", fromEndX + 16, 850);
  drawDottedValue(
    ctx,
    formatCertificateDate(completionDate),
    fromEndX + 52,
    contentRight,
    850,
    {
      startSize: 27,
      minSize: 20,
      bold: true,
      align: "left",
      textPadding: 18,
    }
  );
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "#111111";
  ctx.textAlign = "left";
  ctx.font = "25px Arial, sans-serif";
  ctx.fillText(
    "He/She has acquired good knowledge in theory as well as in practical in the above mentioned course",
    contentLeft,
    902
  );
  ctx.restore();

  const footerCenters = [300, 660, 1020, 1380];
  const footerCenterY = 1030;
  const isoWidth = 190;
  const isoHeight = 145;
  const sealSize = 148;

  drawImageContain(
    ctx,
    isoLogo,
    footerCenters[1] - isoWidth / 2,
    footerCenterY - isoHeight / 2,
    isoWidth,
    isoHeight
  );
  drawImageContain(
    ctx,
    niteRedSeal,
    footerCenters[2] - sealSize / 2,
    footerCenterY - sealSize / 2,
    sealSize,
    sealSize
  );
  drawCertificateSignature(
    ctx,
    footerCenters[0],
    footerCenterY - 28,
    "Head/Director/Principal",
    "(Signature/Stamp Mandatory)"
  );

  return canvas;
};

export const downloadCertificatePdf = async ({ student, subjects, marks }) => {
  const canvas = await renderCertificateCanvas({ student, subjects, marks });
  canvasToPdf(canvas, `certificate-${sanitizeFilePart(student.rollNumber || student.name)}.pdf`, "landscape");
};

export const downloadDmcPdf = async ({ student, subjects, marks }) => {
  const data = getDocData(student, subjects, marks);
  const canvas = document.createElement("canvas");
  canvas.width = 1190;
  canvas.height = 1684;
  const ctx = canvas.getContext("2d");
  const [certificateBackground, niteLogo, isoLogo, msmeLogo, studentPhoto] = await Promise.all([
    loadOptionalImage(ASSETS.dmcBackground),
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
    ctx.fillRect(916, 542, 138, 174);
    ctx.strokeRect(916, 542, 138, 174);
    drawImageCover(ctx, studentPhoto, 924, 550, 122, 158);
  }

  const rows = [
    ["Roll No.", student.rollNumber],
    ["Name", student.name],
    ["Father's Name", student.fatherName],
    ["Date of Birth", formatDate(student.dob)],
    ["Course Name", student.courseName],
    ["Course Duration", formatCourseDuration(student.courseDuration)],
    ["Grade", data.grade],
    ["Result", data.passed ? "PASS" : "FAIL"],
  ];
  ctx.textAlign = "left";
  ctx.strokeStyle = "rgba(201, 130, 8, 0.55)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(105, 525, 980, 365);
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

  drawQr(ctx, RESULT_VERIFY_URL, canvas.width / 2 - 80, 1350, 160);
  ctx.fillStyle = NAVY;
  ctx.font = "bold 18px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    "For more details and Diploma Verification: www.nawabinstitute.in or scan QR Code",
    canvas.width / 2,
    1565
  );
  drawSignature(ctx, 910, 1435, "Head/Director/Principal", "(Signature/Stamp Mandatory)");
  drawImageContain(ctx, msmeLogo, 300, 1397, 165, 86);

  ctx.fillStyle = NAVY;
  ctx.font = "18px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Call at Helpline No.: Off.: 98763-12949, 62809-95745", canvas.width / 2, 1608);
  ctx.fillText("nawabinstitute.in   |   Email: nawab2025@nawabinstitute.com", canvas.width / 2, 1640);

  canvasToPdf(canvas, `dmc-${sanitizeFilePart(student.rollNumber || student.name)}.pdf`, "portrait");
};
