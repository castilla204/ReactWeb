import React, { useMemo, useState, useEffect } from 'react';
import { Mail, Monitor, Smartphone, RefreshCw } from 'lucide-react';
import { AdminCard } from '../../components/admin/ui';
import { useEmailTemplatePreviews } from '../../hooks/useEmailTemplatePreviews';
import { groupEmailTemplates } from '../../lib/emailTemplateGrouping';

const AdminEmailTemplatesPage: React.FC = () => {
  const { previews, isLoading, error, reload } = useEmailTemplatePreviews();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);

  const groups = useMemo(() => groupEmailTemplates(previews), [previews]);
  const selected = useMemo(
    () => previews.find((p) => p.key === selectedKey) ?? null,
    [previews, selectedKey],
  );

  useEffect(() => {
    if (!selectedKey && previews.length > 0) setSelectedKey(previews[0].key);
  }, [previews, selectedKey]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
      <AdminCard>
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Mail className="w-4 h-4" /> Plantillas
            </span>
            <button onClick={() => void reload()} className="text-gray-400 hover:text-gray-600" title="Recargar">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          {isLoading && <div className="text-sm text-gray-500 py-4">Cargando…</div>}
          {error && <div className="text-sm text-red-600 py-4">{error}</div>}
          {!isLoading && !error && groups.map((g) => (
            <div key={g.group} className="mb-3">
              <div className="text-[11px] uppercase tracking-wide text-gray-400 px-2 mb-1">{g.group}</div>
              {g.items.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setSelectedKey(item.key)}
                  className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${
                    item.key === selectedKey ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard>
        <div className="p-3">
          {selected ? (
            <>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div>
                  <div className="text-xs text-gray-400">Asunto</div>
                  <div className="text-sm font-semibold text-gray-800">{selected.subject}</div>
                </div>
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setMobile(false)}
                    className={`p-1.5 rounded-md ${!mobile ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                    title="Escritorio"
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setMobile(true)}
                    className={`p-1.5 rounded-md ${mobile ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                    title="Móvil"
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {selected.key === 'invoice' && (
                <div className="text-xs text-amber-700 bg-amber-50 rounded-md px-3 py-2 mb-3">
                  El email real incluye además la factura en PDF adjunta (no se muestra aquí).
                </div>
              )}
              <div className="flex justify-center bg-gray-100 rounded-lg p-4 overflow-auto">
                <iframe
                  title={`preview-${selected.key}`}
                  srcDoc={selected.html}
                  sandbox=""
                  style={{
                    width: mobile ? 390 : '100%',
                    maxWidth: '100%',
                    height: 700,
                    border: 'none',
                    background: '#fff',
                    borderRadius: 8,
                  }}
                />
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500 py-8 text-center">Selecciona una plantilla para ver su diseño.</div>
          )}
        </div>
      </AdminCard>
    </div>
  );
};

export default AdminEmailTemplatesPage;
