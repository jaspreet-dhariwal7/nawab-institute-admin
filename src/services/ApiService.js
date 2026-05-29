import axios from "axios";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

const getBaseUrl = () => {
	if (typeof window === "undefined") {
		return  import.meta.env.VITE_API_BASE_URL || "";
	}
	return import.meta.env.VITE_API_BASE_URL || "";
};

const apiClient = axios.create({
	baseURL: getBaseUrl(),
	timeout: 30000,
});

const getAuthorizationHeader = (token) => {
	const normalizedToken = token?.trim();
	if (!normalizedToken) return "";
	if (/^(Token|Bearer)\s+/i.test(normalizedToken)) return normalizedToken;
	return `Token ${normalizedToken}`;
};

export const getAuthHeaders = () => {
	const token = Cookies.get("token");
	const authorizationHeader = getAuthorizationHeader(token);
	return authorizationHeader ? { Authorization: authorizationHeader } : {};
};

// Request interceptor: Add token if available, unless in excluded routes
apiClient.interceptors.request.use(
	(config) => {
		if (!(config.data instanceof FormData)) {
			config.headers["Content-Type"] = "application/json";
		}
		if (typeof window !== "undefined") {
			const authHeaders = getAuthHeaders();
			if (authHeaders.Authorization) {
				config.headers.Authorization = authHeaders.Authorization;

			}
		}

		return config;
	},
  (error) => {
    toast.error("Request error! Please try again.");
    return Promise.reject(error);
  }
);

// Response interceptor: Handle global errors
apiClient.interceptors.response.use(
  (response) => {
	if (response.config.responseType === "blob") {
    return response.data; 
  }
	if(response?.data && typeof response.data === "object" && !Array.isArray(response.data)
    ) {
      return {
        ...response.data,
        statusCode: response.status,
      };
    }
	 if (Array.isArray(response.data)) {
      return response.data;
    }
	 return response.data;
  },
	(error) => {
		const message =
			error.response?.data?.message ||
			error.response?.data?.error ||
			error.response?.data?.detail ||
			error.message ||
			"Something went wrong!";
		if (axios.isAxiosError(error)) {
			console.log("Error....", message);

			if (error?.response?.status === 401) {
				toast.error("Your session has expired", {
					id: "session expired toast",
				});
				if (typeof window !== "undefined") {
					Cookies.remove("token");
					localStorage.clear();
					setTimeout(() => {
						window.location.pathname = "/login";
					}, 1000);
				}
			} else {
				console.log("first");
				toast.error(message, { id: "errorMessageToast" });
			}
		}

		console.log("API Error:", message);
		return Promise.reject(error);
	}
);

// Generic API function
export const callApi = async ({
  method,
  url,
  data = null,
  params = null,
  headers = {},
  responseType,
}) => {
	const isFormData =
		typeof FormData !== "undefined" && data instanceof FormData;

	const response = await apiClient({
		method,
		url,
		data,
		params,
		responseType,
		headers: {
			...headers,
			...(isFormData ? {} : {}),
		},
	});

	return response;
};

export default apiClient;
