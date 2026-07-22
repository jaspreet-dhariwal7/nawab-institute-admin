import { callApi } from "../../services/ApiService.js";

const normalizeCourse = (course) => ({
  ...course,
  id: course.id ?? course.pk ?? "",
  name: course.title || course.name || "",
});

export const getAllCourses = async () => {
  const courses = [];
  const visitedUrls = new Set();
  let url = "/courses/";
  let params = { page_size: 1000 };

  while (url && !visitedUrls.has(url)) {
    visitedUrls.add(url);

    const response = await callApi({
      url,
      method: "get",
      params,
    });
    const pageCourses = Array.isArray(response) ? response : response?.results || [];

    courses.push(...pageCourses.map(normalizeCourse));
    url = Array.isArray(response) ? "" : response?.next || "";
    params = null;
  }

  return courses.filter((course) => course.id !== "" && course.name);
};

export const getCourseValue = (course, courses = []) => {
  if (!course) return "";

  const value = typeof course === "object"
    ? course.id ?? course.pk ?? course.title ?? course.name ?? ""
    : course;
  const matchedCourse = courses.find((item) => (
    String(item.id) === String(value) || item.name === value
  ));

  return matchedCourse ? String(matchedCourse.id) : String(value);
};

export const findCourse = (courses, courseId) => courses.find(
  (course) => String(course.id) === String(courseId)
);
