import { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE_URL = (
  globalThis.__APP_CONFIG__?.API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3000"
)
  .trim()
  .replace(/\/+$/, "");
const DEVICES_URL = API_BASE_URL + "/api/devices";

const STATUSES = [
  "Đang sử dụng",
  "Hư hỏng",
  "Đang sửa chữa",
  "Ngừng sử dụng",
];

const EMPTY_FORM = {
  deviceId: "",
  name: "",
  deviceType: "",
  room: "",
  brand: "",
  model: "",
  quantity: "",
  status: STATUSES[0],
  purchaseDate: "",
  description: "",
};

function Icon({ name, size = 18 }) {
  const shared = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const paths = {
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 4.2 4.2" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 7v5h-5" />
        <path d="M4.6 9a7.5 7.5 0 0 1 12.7-2.7L20 9" />
        <path d="M4 17v-5h5" />
        <path d="M19.4 15a7.5 7.5 0 0 1-12.7 2.7L4 15" />
      </>
    ),
    eye: (
      <>
        <path d="M2.5 12s3.3-6 9.5-6 9.5 6 9.5 6-3.3 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    edit: (
      <>
        <path d="m14.5 6.5 3 3" />
        <path d="M4 20h4l11-11a2.1 2.1 0 0 0-4-2L4 18v2Z" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16" />
        <path d="M10 11v6M14 11v6" />
        <path d="m6 7 1 13h10l1-13" />
        <path d="M9 7V4h6v3" />
      </>
    ),
    box: (
      <>
        <path d="m12 3 8.5 4.5v9L12 21l-8.5-4.5v-9L12 3Z" />
        <path d="m3.8 7.7 8.2 4.5 8.2-4.5M12 12.2V21" />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16.5 9" />
      </>
    ),
    wrench: (
      <>
        <path d="M14.5 6.2a5 5 0 0 0-6.7 6.7L3.5 17.2a2.1 2.1 0 0 0 3 3l4.3-4.3a5 5 0 0 0 6.7-6.7l-3 3-3.1-3.1 3.1-2.9Z" />
      </>
    ),
    pause: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M10 9v6M14 9v6" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
    alert: (
      <>
        <path d="m12 3 9 16H3l9-16Z" />
        <path d="M12 9v4M12 16h.01" />
      </>
    ),
  };

  return <svg {...shared}>{paths[name]}</svg>;
}

async function requestJson(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body) headers["Content-Type"] = "application/json";

  const response = await fetch(url, { ...options, headers });
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data && data.message ? data.message : "Yêu cầu chưa thực hiện được.";
    throw new Error(message);
  }

  return data;
}

function statusClass(status) {
  if (status === "Đang sử dụng") return "in-use";
  if (status === "Hư hỏng") return "broken";
  if (status === "Đang sửa chữa") return "repairing";
  if (status === "Ngừng sử dụng") return "stopped";
  return "unknown";
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function toDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function DeviceForm({ device, saving, onCancel, onSubmit }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    ...(device || {}),
    quantity: device ? String(device.quantity) : "",
    purchaseDate: toDateInput(device && device.purchaseDate),
  }));
  const [formError, setFormError] = useState("");

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (formError) setFormError("");
  }

  function submit(event) {
    event.preventDefault();
    const quantity = Number(form.quantity);

    if (!Number.isInteger(quantity) || quantity < 0) {
      setFormError("Số lượng phải là số nguyên không âm.");
      return;
    }

    if (!STATUSES.includes(form.status)) {
      setFormError("Vui lòng chọn tình trạng thiết bị hợp lệ.");
      return;
    }

    onSubmit({
      deviceId: form.deviceId.trim(),
      name: form.name.trim(),
      deviceType: form.deviceType.trim(),
      room: form.room.trim(),
      brand: form.brand.trim(),
      model: form.model.trim(),
      quantity,
      status: form.status,
      purchaseDate: form.purchaseDate || null,
      description: form.description.trim(),
    });
  }

  return (
    <form className="device-form" onSubmit={submit}>
      <div className="form-grid">
        <label className="field">
          <span>Mã thiết bị <b>*</b></span>
          <input
            autoFocus
            required
            name="deviceId"
            value={form.deviceId}
            onChange={updateField}
            placeholder="VD: TB-MC-001"
            maxLength={40}
          />
        </label>
        <label className="field">
          <span>Tên thiết bị <b>*</b></span>
          <input
            required
            name="name"
            value={form.name}
            onChange={updateField}
            placeholder="VD: Máy chiếu Epson"
            maxLength={120}
          />
        </label>
        <label className="field">
          <span>Loại thiết bị <b>*</b></span>
          <input
            required
            name="deviceType"
            value={form.deviceType}
            onChange={updateField}
            placeholder="VD: Máy chiếu"
            maxLength={80}
          />
        </label>
        <label className="field">
          <span>Phòng học <b>*</b></span>
          <input
            required
            name="room"
            value={form.room}
            onChange={updateField}
            placeholder="VD: A101"
            maxLength={40}
          />
        </label>
        <label className="field">
          <span>Hãng sản xuất</span>
          <input
            name="brand"
            value={form.brand}
            onChange={updateField}
            placeholder="VD: Epson"
            maxLength={80}
          />
        </label>
        <label className="field">
          <span>Model</span>
          <input
            name="model"
            value={form.model}
            onChange={updateField}
            placeholder="VD: EB-X06"
            maxLength={80}
          />
        </label>
        <label className="field">
          <span>Số lượng <b>*</b></span>
          <input
            required
            type="number"
            name="quantity"
            min="0"
            step="1"
            value={form.quantity}
            onChange={updateField}
            placeholder="0"
          />
        </label>
        <label className="field">
          <span>Tình trạng <b>*</b></span>
          <select required name="status" value={form.status} onChange={updateField}>
            {STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Ngày mua hoặc tiếp nhận</span>
          <input
            type="date"
            name="purchaseDate"
            value={form.purchaseDate}
            onChange={updateField}
          />
        </label>
        <label className="field field-wide">
          <span>Mô tả, ghi chú</span>
          <textarea
            name="description"
            value={form.description}
            onChange={updateField}
            rows="3"
            maxLength={500}
            placeholder="Ghi chú về thiết bị (nếu có)"
          />
        </label>
      </div>

      {formError && <p className="form-error" role="alert">{formError}</p>}

      <div className="modal-actions">
        <button className="button button-quiet" type="button" onClick={onCancel}>
          Hủy
        </button>
        <button className="button button-primary" type="submit" disabled={saving}>
          {saving ? "Đang lưu…" : device ? "Lưu thay đổi" : "Thêm thiết bị"}
        </button>
      </div>
    </form>
  );
}

function DeviceDetails({ device }) {
  const fields = [
    ["Mã thiết bị", device.deviceId],
    ["Tên thiết bị", device.name],
    ["Loại thiết bị", device.deviceType],
    ["Phòng học", device.room],
    ["Hãng sản xuất", device.brand],
    ["Model", device.model],
    ["Số lượng", device.quantity],
    ["Ngày mua hoặc tiếp nhận", formatDate(device.purchaseDate)],
  ];

  return (
    <div className="device-details">
      <div className="detail-status-row">
        <span className="detail-label">Tình trạng</span>
        <span className={"status-pill status-" + statusClass(device.status)}>
          <span className="status-dot" />
          {device.status}
        </span>
      </div>
      <div className="detail-grid">
        {fields.map(([label, value]) => (
          <div className="detail-item" key={label}>
            <span>{label}</span>
            <strong>{value || "—"}</strong>
          </div>
        ))}
        <div className="detail-item detail-wide">
          <span>Mô tả, ghi chú</span>
          <strong>{device.description || "Chưa có ghi chú"}</strong>
        </div>
      </div>
    </div>
  );
}

function Modal({ title, subtitle, children, onClose, wide = false }) {
  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        className={"modal" + (wide ? " modal-wide" : "")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header className="modal-header">
          <div>
            <h2 id="modal-title">{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="icon-button close-button" type="button" onClick={onClose} aria-label="Đóng">
            <Icon name="close" />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function App() {
  const [devices, setDevices] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const loadDevices = useCallback(async (term = "") => {
    setLoading(true);
    setError("");
    const query = term.trim()
      ? "?search=" + encodeURIComponent(term.trim())
      : "";

    try {
      const result = await requestJson(DEVICES_URL + query);
      setDevices(Array.isArray(result) ? result : []);
    } catch (loadError) {
      setError(
        loadError instanceof TypeError
          ? "Không thể kết nối backend. Hãy kiểm tra backend đang chạy và địa chỉ API."
          : loadError.message
      );
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => loadDevices(search), 250);
    return () => window.clearTimeout(timer);
  }, [search, loadDevices]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 3600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const stats = useMemo(() => ({
    total: devices.length,
    inUse: devices.filter((device) => device.status === "Đang sử dụng").length,
    attention: devices.filter((device) =>
      device.status === "Hư hỏng" || device.status === "Đang sửa chữa"
    ).length,
    stopped: devices.filter((device) => device.status === "Ngừng sử dụng").length,
  }), [devices]);

  async function saveDevice(payload) {
    if (!modal) return;
    setSaving(true);
    try {
      const editing = modal.type === "edit";
      const url = editing
        ? DEVICES_URL + "/" + encodeURIComponent(modal.device._id)
        : DEVICES_URL;
      await requestJson(url, {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      setModal(null);
      setNotice(editing ? "Đã cập nhật thiết bị." : "Đã thêm thiết bị.");
      await loadDevices(search);
    } catch (saveError) {
      setError("");
      setModal((current) => current && ({
        ...current,
        error: saveError instanceof TypeError
          ? "Không thể kết nối backend. Kiểm tra địa chỉ API."
          : saveError.message,
      }));
    } finally {
      setSaving(false);
    }
  }

  async function deleteDevice(device) {
    const confirmed = window.confirm(
      "Bạn có chắc muốn xóa thiết bị “" + device.name + "” (" + device.deviceId + ")?"
    );
    if (!confirmed) return;

    setDeletingId(device._id);
    setError("");
    try {
      await requestJson(DEVICES_URL + "/" + encodeURIComponent(device._id), {
        method: "DELETE",
      });
      setNotice("Đã xóa thiết bị.");
      await loadDevices(search);
    } catch (deleteError) {
      setError(
        deleteError instanceof TypeError
          ? "Không thể kết nối backend. Kiểm tra địa chỉ API."
          : deleteError.message
      );
    } finally {
      setDeletingId("");
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Trang chủ quản lý thiết bị">
          <span className="brand-mark"><Icon name="box" size={21} /></span>
          <span className="brand-copy">
            <strong>Phòng học</strong>
            <small>QUẢN LÝ THIẾT BỊ</small>
          </span>
        </a>
        <div className="student-badge">
          <span className="student-avatar">NH</span>
          <span><strong>NguyenMinhHao</strong><small>MSSV 235304</small></span>
        </div>
      </header>

      <main className="main-content">
        <section className="welcome-panel">
          <div className="welcome-copy">
            <span className="eyebrow"><span className="live-dot" /> HỆ THỐNG QUẢN LÝ</span>
            <h1>Thiết bị phòng học</h1>
            <p>Theo dõi danh sách, số lượng và tình trạng thiết bị trong các phòng học.</p>
          </div>
          <div className="welcome-art" aria-hidden="true">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-device"><Icon name="box" size={42} /></div>
            <div className="art-chip chip-one"><span /></div>
            <div className="art-chip chip-two"><span /></div>
          </div>
        </section>

        <section className="stats-grid" aria-label="Tổng quan thiết bị">
          <StatCard label="Thiết bị trong kết quả" value={stats.total} icon="box" tone="blue" />
          <StatCard label="Đang sử dụng" value={stats.inUse} icon="check" tone="green" />
          <StatCard label="Cần xử lý" value={stats.attention} icon="wrench" tone="orange" />
          <StatCard label="Ngừng sử dụng" value={stats.stopped} icon="pause" tone="slate" />
        </section>

        <section className="inventory-panel">
          <div className="inventory-heading">
            <div>
              <div className="section-kicker">DANH MỤC</div>
              <h2>Danh sách thiết bị</h2>
              <p>Tra cứu và cập nhật thiết bị theo từng phòng học.</p>
            </div>
            <button
              className="button button-primary add-button"
              type="button"
              onClick={() => setModal({ type: "create", device: null, error: "" })}
            >
              <Icon name="plus" size={19} />
              Thêm thiết bị
            </button>
          </div>

          <div className="toolbar">
            <label className="search-box">
              <Icon name="search" size={19} />
              <input
                type="search"
                aria-label="Tìm kiếm thiết bị"
                placeholder="Tìm theo mã, tên, loại hoặc phòng..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="clear-search"
                  onClick={() => setSearch("")}
                  aria-label="Xóa tìm kiếm"
                >
                  <Icon name="close" size={16} />
                </button>
              )}
            </label>
            <span className="result-count">
              {loading ? "Đang tải…" : devices.length + " thiết bị"}
            </span>
            <button
              className="button button-outline refresh-button"
              type="button"
              onClick={() => loadDevices(search)}
              disabled={loading}
              aria-label="Tải lại danh sách"
            >
              <Icon name="refresh" size={17} />
              <span>Tải lại</span>
            </button>
          </div>

          {error && (
            <div className="error-banner" role="alert">
              <span className="error-icon"><Icon name="alert" size={18} /></span>
              <span>{error}</span>
              <button type="button" onClick={() => loadDevices(search)}>Thử lại</button>
            </div>
          )}

          <div className="table-wrap">
            <table className="device-table">
              <thead>
                <tr>
                  <th>THIẾT BỊ</th>
                  <th>LOẠI / HÃNG</th>
                  <th>PHÒNG</th>
                  <th>SỐ LƯỢNG</th>
                  <th>TÌNH TRẠNG</th>
                  <th className="actions-heading">THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {loading && devices.length === 0 ? (
                  <tr><td className="table-message" colSpan="6">Đang tải dữ liệu thiết bị…</td></tr>
                ) : devices.length === 0 ? (
                  <tr>
                    <td className="empty-cell" colSpan="6">
                      <div className="empty-state">
                        <span className="empty-icon"><Icon name="box" size={25} /></span>
                        <strong>{search ? "Không tìm thấy thiết bị" : "Chưa có thiết bị nào"}</strong>
                        <span>{search ? "Thử một từ khóa khác." : "Thêm thiết bị đầu tiên để bắt đầu quản lý."}</span>
                        {!search && (
                          <button
                            className="button button-primary empty-add"
                            type="button"
                            onClick={() => setModal({ type: "create", device: null, error: "" })}
                          >
                            <Icon name="plus" size={17} /> Thêm thiết bị
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  devices.map((device) => (
                    <tr key={device._id || device.deviceId}>
                      <td>
                        <div className="device-name-cell">
                          <span className="device-avatar"><Icon name="box" size={18} /></span>
                          <span className="device-ident">
                            <strong>{device.name}</strong>
                            <small>{device.deviceId}</small>
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="type-primary">{device.deviceType}</span>
                        <small className="table-secondary">{[device.brand, device.model].filter(Boolean).join(" · ") || "Chưa cập nhật hãng"}</small>
                      </td>
                      <td><span className="room-tag">{device.room}</span></td>
                      <td><span className="quantity-value">{device.quantity}</span></td>
                      <td>
                        <span className={"status-pill status-" + statusClass(device.status)}>
                          <span className="status-dot" />
                          {device.status}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button className="table-action" type="button" title="Xem chi tiết" onClick={() => setModal({ type: "detail", device, error: "" })}>
                            <Icon name="eye" size={15} /> Chi tiết
                          </button>
                          <button className="table-action" type="button" title="Cập nhật" onClick={() => setModal({ type: "edit", device, error: "" })}>
                            <Icon name="edit" size={15} /> Sửa
                          </button>
                          <button className="table-action table-action-danger" type="button" title="Xóa" disabled={deletingId === device._id} onClick={() => deleteDevice(device)}>
                            <Icon name="trash" size={15} /> Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="inventory-footer">
            <span>Hiển thị <strong>{devices.length}</strong> thiết bị</span>
            <span>Dữ liệu được đồng bộ từ backend</span>
          </div>
        </section>

        <footer className="page-footer">
          <span>Hệ thống quản lý thiết bị phòng học</span>
          <span>235304 · NguyenMinhHao</span>
        </footer>
      </main>

      {notice && (
        <div className="toast" role="status">
          <span className="toast-check"><Icon name="check" size={16} /></span>
          {notice}
        </div>
      )}

      {modal && (
        <Modal
          title={
            modal.type === "create" ? "Thêm thiết bị mới"
              : modal.type === "edit" ? "Cập nhật thiết bị"
                : "Chi tiết thiết bị"
          }
          subtitle={
            modal.type === "create" ? "Nhập thông tin thiết bị để lưu vào danh mục."
              : modal.type === "edit" ? "Chỉnh sửa thông tin và tình trạng thiết bị."
                : modal.device.deviceId
          }
          onClose={() => setModal(null)}
          wide={modal.type !== "detail"}
        >
          {modal.type === "detail" ? (
            <>
              <DeviceDetails device={modal.device} />
              <div className="modal-actions">
                <button className="button button-quiet" type="button" onClick={() => setModal(null)}>Đóng</button>
                <button className="button button-primary" type="button" onClick={() => setModal({ type: "edit", device: modal.device, error: "" })}>
                  <Icon name="edit" size={17} /> Chỉnh sửa
                </button>
              </div>
            </>
          ) : (
            <>
              {modal.error && <div className="form-api-error" role="alert">{modal.error}</div>}
              <DeviceForm
                key={modal.type + (modal.device ? modal.device._id : "")}
                device={modal.device}
                saving={saving}
                onCancel={() => setModal(null)}
                onSubmit={saveDevice}
              />
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, tone }) {
  return (
    <article className="stat-card">
      <span className={"stat-icon stat-" + tone}><Icon name={icon} size={20} /></span>
      <span className="stat-copy">
        <small>{label}</small>
        <strong>{value}</strong>
      </span>
      <span className={"stat-indicator indicator-" + tone} />
    </article>
  );
}

export default App;
