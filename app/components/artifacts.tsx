import {
  useEffect,
  useState,
  useRef,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { useParams } from "react-router";
import { IconButton } from "./button";
import { nanoid } from "nanoid";
import ExportIcon from "../icons/share.svg";
import CopyIcon from "../icons/copy.svg";
import DownloadIcon from "../icons/download.svg";
import GithubIcon from "../icons/github.svg";
import LoadingButtonIcon from "../icons/loading.svg";
import ReloadButtonIcon from "../icons/reload.svg";
import CloseIcon from "../icons/close.svg";
import Locale from "../locales";
import { Modal, showToast } from "./ui-lib";
import { copyToClipboard, downloadAs } from "../utils";
import { Path, ApiPath, REPO_URL } from "@/app/constant";
import { Loading } from "./home";
import styles from "./artifacts.module.scss";

type HTMLPreviewProps = {
  code: string;
  type?: "html" | "svg" | "mermaid";
  autoHeight?: boolean;
  height?: number | string;
  onLoad?: (title?: string) => void;
};

export type HTMLPreviewHandler = {
  reload: () => void;
};

export const HTMLPreview = forwardRef<HTMLPreviewHandler, HTMLPreviewProps>(
  function HTMLPreview(props, ref) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [frameId, setFrameId] = useState<string>(nanoid());
    const [iframeHeight, setIframeHeight] = useState(600);
    const [title, setTitle] = useState("");
    /*
     * https://stackoverflow.com/questions/19739001/what-is-the-difference-between-srcdoc-and-src-datatext-html-in-an
     * 1. using srcdoc
     * 2. using src with dataurl:
     *    easy to share
     *    length limit (Data URIs cannot be larger than 32,768 characters.)
     */

    useEffect(() => {
      const handleMessage = (e: any) => {
        const { id, height, title } = e.data;
        setTitle(title);
        if (id == frameId) {
          setIframeHeight(height);
        }
      };
      window.addEventListener("message", handleMessage);
      return () => {
        window.removeEventListener("message", handleMessage);
      };
    }, [frameId]);

    useImperativeHandle(ref, () => ({
      reload: () => {
        setFrameId(nanoid());
      },
    }));

    const height = useMemo(() => {
      if (!props.autoHeight) return props.height || 600;
      if (typeof props.height === "string") {
        return props.height;
      }
      const parentHeight = props.height || 600;
      return iframeHeight + 40 > parentHeight
        ? parentHeight
        : iframeHeight + 40;
    }, [props.autoHeight, props.height, iframeHeight]);

    const srcDoc = useMemo(() => {
      const script = `<script>window.addEventListener("DOMContentLoaded", () => new ResizeObserver((entries) => parent.postMessage({id: '${frameId}', height: entries[0].target.clientHeight}, '*')).observe(document.body))</script>`;
      let html = props.code;

      if (props.type === "svg") {
        html = `<!DOCTYPE html><html><head><style>body { margin: 0; padding: 10px; background: #f5f5f5; }</style></head><body>${props.code}</body></html>`;
      } else if (props.type === "mermaid") {
        html = `<!DOCTYPE html><html><head><script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script><style>body { margin: 0; padding: 10px; background: #f5f5f5; } .mermaid { display: flex; justify-content: center; }</style></head><body><div class="mermaid">${props.code}</div><script>mermaid.contentLoaded();</script></body></html>`;
      }

      if (html.includes("<!DOCTYPE html>")) {
        html = html.replace("<!DOCTYPE html>", "<!DOCTYPE html>" + script);
      } else {
        html = script + html;
      }
      return html;
    }, [props.code, props.type, frameId]);

    const handleOnLoad = () => {
      if (props?.onLoad) {
        props.onLoad(title);
      }
    };

    return (
      <iframe
        className={styles["artifacts-iframe"]}
        key={frameId}
        ref={iframeRef}
        sandbox="allow-forms allow-modals allow-scripts allow-same-origin"
        style={{ height }}
        srcDoc={srcDoc}
        onLoad={handleOnLoad}
      />
    );
  },
);

/**
 * Detect code artifacts from markdown content
 */
export function detectArtifacts(content: string): Array<{
  type: "html" | "svg" | "mermaid";
  code: string;
  language: string;
}> {
  const artifacts: Array<{
    type: "html" | "svg" | "mermaid";
    code: string;
    language: string;
  }> = [];
  const codeBlockRegex = /```([\w-]+)\n([\s\S]*?)```/g;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1]?.toLowerCase() || "";
    const code = match[2].trim();

    if (["html", "svg", "mermaid"].includes(language) && code.length > 20) {
      artifacts.push({
        type: language as "html" | "svg" | "mermaid",
        code,
        language,
      });
    }
  }

  return artifacts;
}

export function ArtifactsShareButton({
  getCode,
  id,
  style,
  fileName,
}: {
  getCode: () => string;
  id?: string;
  style?: any;
  fileName?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(id);
  const [show, setShow] = useState(false);
  const shareUrl = useMemo(
    () => [location.origin, "#", Path.Artifacts, "/", name].join(""),
    [name],
  );
  const upload = (code: string) =>
    id
      ? Promise.resolve({ id })
      : fetch(ApiPath.Artifacts, {
          method: "POST",
          body: code,
        })
          .then((res) => res.json())
          .then(({ id }) => {
            if (id) {
              return { id };
            }
            throw Error();
          })
          .catch((e) => {
            showToast(Locale.Export.Artifacts.Error);
          });
  return (
    <>
      <div className="window-action-button" style={style}>
        <IconButton
          icon={loading ? <LoadingButtonIcon /> : <ExportIcon />}
          bordered
          title={Locale.Export.Artifacts.Title}
          onClick={() => {
            if (loading) return;
            setLoading(true);
            upload(getCode())
              .then((res) => {
                if (res?.id) {
                  setShow(true);
                  setName(res?.id);
                }
              })
              .finally(() => setLoading(false));
          }}
        />
      </div>
      {show && (
        <div className="modal-mask">
          <Modal
            title={Locale.Export.Artifacts.Title}
            onClose={() => setShow(false)}
            actions={[
              <IconButton
                key="download"
                icon={<DownloadIcon />}
                bordered
                text={Locale.Export.Download}
                onClick={() => {
                  downloadAs(getCode(), `${fileName || name}.html`).then(() =>
                    setShow(false),
                  );
                }}
              />,
              <IconButton
                key="copy"
                icon={<CopyIcon />}
                bordered
                text={Locale.Chat.Actions.Copy}
                onClick={() => {
                  copyToClipboard(shareUrl).then(() => setShow(false));
                }}
              />,
            ]}
          >
            <div>
              <a target="_blank" href={shareUrl}>
                {shareUrl}
              </a>
            </div>
          </Modal>
        </div>
      )}
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// ArtifactsSidePanel — Chat-integrated preview panel (Step 2)
// ──────────────────────────────────────────────────────────────────────────

export type ArtifactItem = {
  id: string;
  type: "html" | "svg" | "mermaid";
  code: string;
  language: string;
  /** Which message this artifact belongs to (for display) */
  messageIndex: number;
};

export function ArtifactsSidePanel(props: {
  artifacts: ArtifactItem[];
  onClose: () => void;
}) {
  const { artifacts, onClose } = props;
  const [activeIndex, setActiveIndex] = useState(0);
  const previewRef = useRef<HTMLPreviewHandler>(null);

  // Reset to first tab when artifacts list changes
  useEffect(() => {
    setActiveIndex(0);
  }, [artifacts.length]);

  const activeArtifact = artifacts[activeIndex];

  const tabLabel = useCallback((item: ArtifactItem, idx: number) => {
    const typeLabel =
      item.type === "mermaid"
        ? "Diagram"
        : item.type === "svg"
        ? "SVG"
        : "HTML";
    return `${typeLabel} ${idx + 1}`;
  }, []);

  return (
    <div className={styles["artifacts-side-panel"]}>
      {/* Header */}
      <div className={styles["artifacts-side-panel-header"]}>
        <span className={styles["artifacts-side-panel-title"]}>
          {Locale.Chat.Artifacts.Title}
        </span>
        <IconButton
          icon={<CloseIcon />}
          bordered
          onClick={onClose}
          title={Locale.Chat.Artifacts.Close}
        />
      </div>

      {artifacts.length === 0 ? (
        <div className={styles["artifacts-side-panel-empty"]}>
          {Locale.Chat.Artifacts.Empty}
        </div>
      ) : (
        <>
          {/* Tabs */}
          {artifacts.length > 1 && (
            <div className={styles["artifacts-side-panel-tabs"]}>
              {artifacts.map((item, idx) => (
                <button
                  key={item.id}
                  className={[
                    styles["artifacts-tab"],
                    idx === activeIndex ? styles["artifacts-tab-active"] : "",
                  ].join(" ")}
                  onClick={() => setActiveIndex(idx)}
                >
                  {tabLabel(item, idx)}
                </button>
              ))}
            </div>
          )}

          {/* Preview area */}
          {activeArtifact && (
            <div className={styles["artifacts-side-panel-content"]}>
              <div className={styles["artifacts-side-panel-toolbar"]}>
                <span className={styles["artifacts-type-badge"]}>
                  {activeArtifact.language.toUpperCase()}
                </span>
                <IconButton
                  icon={<ReloadButtonIcon />}
                  bordered
                  onClick={() => previewRef.current?.reload()}
                  title="Reload"
                />
                <ArtifactsShareButton getCode={() => activeArtifact.code} />
              </div>
              <HTMLPreview
                ref={previewRef}
                key={activeArtifact.id}
                code={activeArtifact.code}
                type={activeArtifact.type}
                autoHeight={false}
                height="100%"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function Artifacts() {
  const { id } = useParams();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [fileName, setFileName] = useState("");
  const previewRef = useRef<HTMLPreviewHandler>(null);

  useEffect(() => {
    if (id) {
      fetch(`${ApiPath.Artifacts}?id=${id}`)
        .then((res) => {
          if (res.status > 300) {
            throw Error("can not get content");
          }
          return res;
        })
        .then((res) => res.text())
        .then(setCode)
        .catch((e) => {
          showToast(Locale.Export.Artifacts.Error);
        });
    }
  }, [id]);

  return (
    <div className={styles["artifacts"]}>
      <div className={styles["artifacts-header"]}>
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
          <IconButton bordered icon={<GithubIcon />} shadow />
        </a>
        <IconButton
          bordered
          style={{ marginLeft: 20 }}
          icon={<ReloadButtonIcon />}
          shadow
          onClick={() => previewRef.current?.reload()}
        />
        <div className={styles["artifacts-title"]}>ModelPanda Artifacts</div>
        <ArtifactsShareButton
          id={id}
          getCode={() => code}
          fileName={fileName}
        />
      </div>
      <div className={styles["artifacts-content"]}>
        {loading && <Loading />}
        {code && (
          <HTMLPreview
            code={code}
            ref={previewRef}
            autoHeight={false}
            height={"100%"}
            onLoad={(title) => {
              setFileName(title as string);
              setLoading(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
