import StreamSaver from 'streamsaver';
import { errorCodeRecord } from '@/constants/common';
import { localStg } from '@/utils/storage';
import { getServiceBaseURL } from '@/utils/service';
import { transformToURLSearchParams } from '@/utils/common';

interface RequestConfig {
  method: 'GET' | 'POST';
  url: string;
  params?: Record<string, any>;
  filename?: string;
  contentType?: string;
}

export function useDownload() {
  const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
  const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);

  const isHttps = () => {
    const protocol = document.location.protocol;
    const hostname = document.location.hostname;
    return protocol === 'https' || hostname === 'localhost' || hostname === '127.0.0.1';
  };

  /** 获取通用请求头 */
  const getCommonHeaders = (contentType = 'application/octet-stream') => ({
    Authorization: `Bearer ${localStg.get('token')}`,
    Clientid: import.meta.env.VITE_APP_CLIENT_ID!,
    'Content-Type': contentType
  });

  /** 通用下载方法 */
  function downloadByData(data: BlobPart, filename: string, type = 'application/octet-stream') {
    const blob = new Blob([data], { type });
    const blobURL = window.URL.createObjectURL(blob);

    const tempLink = Object.assign(document.createElement('a'), {
      style: { display: 'none' },
      href: blobURL,
      download: filename
    });

    if (typeof tempLink.download === 'undefined') {
      tempLink.setAttribute('target', '_blank');
    }

    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);
    window.URL.revokeObjectURL(blobURL);
  }

  /** 流式下载 */
  async function downloadByStream(
    readableStream: ReadableStream<Uint8Array>,
    filename: string,
    contentLength?: number
  ): Promise<void> {
    window.$loading?.endLoading();
    StreamSaver.mitm = '/streamsaver/mitm.html?version=2.0.0';
    const fileStream = StreamSaver.createWriteStream(filename, { size: contentLength });

    if (window.WritableStream && readableStream?.pipeTo) {
      await readableStream.pipeTo(fileStream);
      window.$message?.success('下载完成');
      return;
    }

    // 降级处理
    const writer = fileStream.getWriter();
    const reader = readableStream.getReader();

    const pump = async (): Promise<void> => {
      const { done, value } = await reader.read();
      if (done) return writer.close();
      await writer.write(value);
      return pump();
    };

    await pump();
  }

  /** 处理响应 */
  async function handleResponse(response: Response) {
    if (response.headers.get('Content-Type')?.includes('application/json')) {
      const res = await response.json();
      const code = res.code as CommonType.ErrorCode;
      throw new Error(errorCodeRecord[code] || res.msg || errorCodeRecord.default);
    }
  }

  /** 核心下载逻辑；成功返回 true，失败返回 false（错误信息已 toast） */
  async function executeDownload(config: RequestConfig): Promise<boolean> {
    const { method, url, params, filename, contentType } = config;
    const timestamp = Date.now();
    const fullUrl = `${baseURL}${url}${url.includes('?') ? '&' : '?'}t=${timestamp}`;

    window.$loading?.startLoading('正在下载数据，请稍候...');

    try {
      const requestOptions: RequestInit = {
        method,
        headers: getCommonHeaders(contentType)
      };

      if (method === 'POST' && params) {
        requestOptions.body = transformToURLSearchParams(params);
        requestOptions.headers = {
          ...requestOptions.headers,
          'Content-Type': 'application/x-www-form-urlencoded'
        };
      }

      const response = await fetch(fullUrl, requestOptions);

      if (response.status !== 200) {
        throw new Error(errorCodeRecord.default);
      }

      await handleResponse(response);

      const rawHeader = response.headers.get('Download-Filename');
      const finalFilename = filename || (rawHeader ? decodeURIComponent(rawHeader) : null) || `download-${timestamp}`;

      if (response.body && isHttps()) {
        const contentLength = Number(response.headers.get('Content-Length'));
        await downloadByStream(response.body, finalFilename, contentLength);
        return true;
      }

      const responseContentType = response.headers.get('Content-Type');
      const mainType = responseContentType?.split(';')[0]?.trim() || 'application/octet-stream';
      downloadByData(await response.blob(), finalFilename, mainType);
      return true;
    } catch (error: any) {
      window.$message?.error(error.message);
      return false;
    } finally {
      window.$loading?.endLoading();
    }
  }

  /** 公共下载接口 */
  const download = (url: string, params: Record<string, any>, filename: string) =>
    executeDownload({ method: 'POST', url, params, filename });

  /** OSS文件下载 */
  const oss = (ossId: CommonType.IdType) =>
    executeDownload({
      method: 'GET',
      url: `/resource/oss/download/${ossId}`
    });

  /** ZIP文件下载 */
  const zip = (url: string, filename: string) =>
    executeDownload({
      method: 'GET',
      url,
      filename,
      contentType: 'application/octet-stream'
    });

  /** 带鉴权 GET，返回规范化 MIME 的 Blob（勿用地址栏直链，以免丢 token） */
  async function authenticatedGetBlob(url: string): Promise<Blob> {
    const timestamp = Date.now();
    const fullUrl = `${baseURL}${url}${url.includes('?') ? '&' : '?'}t=${timestamp}`;
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: getCommonHeaders('application/octet-stream')
    });
    if (response.status !== 200) {
      throw new Error(errorCodeRecord.default);
    }
    await handleResponse(response);
    const responseContentType = response.headers.get('Content-Type');
    const mainType = responseContentType?.split(';')[0]?.trim() || 'application/octet-stream';
    const blob = await response.blob();
    const mime = mainType || blob.type || 'application/octet-stream';
    return new Blob([blob], { type: mime });
  }

  /**
   * 带鉴权拉取 PDF（等）后，用隐藏 iframe 调起系统打印对话框。
   * 无法跳过浏览器打印确认（安全限制）；部分环境内嵌 PDF 打印不稳定，失败时请「PDF 下载」后本地打印。
   */
  async function printBlobFromAuthenticatedGet(
    url: string,
    loadingText = '正在准备打印...'
  ): Promise<boolean> {
    window.$loading?.startLoading(loadingText);
    let objectUrl: string | null = null;
    let iframe: HTMLIFrameElement | null = null;
    let loadTimeoutId: number | undefined;

    const cleanup = () => {
      if (loadTimeoutId != null) {
        window.clearTimeout(loadTimeoutId);
        loadTimeoutId = undefined;
      }
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
      if (iframe?.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
      iframe = null;
    };

    try {
      const blob = await authenticatedGetBlob(url);
      objectUrl = window.URL.createObjectURL(blob);
      iframe = document.createElement('iframe');
      iframe.setAttribute('title', 'print');
      iframe.setAttribute('aria-hidden', 'true');
      /**
       * 勿用 0×0：Chrome 在内嵌 PDF 上 print() 时，视口为 0 易走极简打印预览；
       * 离屏给足尺寸，打印侧栏更接近正常文档打印体验。
       */
      Object.assign(iframe.style, {
        position: 'fixed',
        top: '0',
        left: '-10000px',
        width: '1240px',
        height: '1754px',
        border: '0',
        margin: '0',
        padding: '0',
        opacity: '0',
        pointerEvents: 'none',
        zIndex: '-1'
      });
      iframe.src = objectUrl;
      document.body.appendChild(iframe);

      await new Promise<void>((resolve, reject) => {
        if (!iframe) {
          reject(new Error(errorCodeRecord.default));
          return;
        }
        loadTimeoutId = window.setTimeout(() => {
          reject(new Error('加载打印超时，请使用「PDF 下载」后本地打印'));
        }, 45_000);

        iframe.onerror = () => {
          if (loadTimeoutId != null) {
            window.clearTimeout(loadTimeoutId);
            loadTimeoutId = undefined;
          }
          reject(new Error(errorCodeRecord.default));
        };
        iframe.onload = () => {
          if (loadTimeoutId != null) {
            window.clearTimeout(loadTimeoutId);
            loadTimeoutId = undefined;
          }
          window.setTimeout(() => {
            try {
              const w = iframe?.contentWindow;
              if (!w) {
                reject(new Error('当前环境无法内嵌打印，请使用「PDF 下载」后本地打开打印'));
                return;
              }
              w.addEventListener('afterprint', () => cleanup(), { once: true });
              window.setTimeout(() => {
                if (objectUrl) cleanup();
              }, 600_000);
              w.focus();
              w.print();
              resolve();
            } catch {
              reject(new Error('内嵌打印失败，请使用「PDF 下载」后本地打印'));
            }
          }, 400);
        };
      });
      return true;
    } catch (error: any) {
      cleanup();
      window.$message?.error(error.message);
      return false;
    } finally {
      window.$loading?.endLoading();
    }
  }

  return {
    oss,
    zip,
    download,
    printBlobFromAuthenticatedGet
  };
}
