import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PrivacyPolicy() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="font-medium">Volver</span>
                </button>

                <div className="bg-white p-6">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-lg font-medium text-gray-800 mb-3">Política de Privacidad</h1>
                        <div className="text-xs text-gray-500 space-y-1">
                            <p>Última actualización: 08 de abril de 2025</p>
                            <p>Fecha efectiva: 08 de abril de 2025</p>
                        </div>
                    </div>

                    {/* Información de contacto */}
                    <div className="mb-6 pb-4 border-b border-gray-100">
                        <h2 className="text-sm font-medium text-gray-700 mb-3">Información de la Empresa</h2>
                        <div className="text-xs text-gray-600 space-y-1">
                            <p><strong>Razón Social:</strong> Inspecciono</p>
                            <p><strong>Dirección:</strong> C/Pedro I de Aragón, 14, Soria 50003, España</p>
                            <p><strong>Email:</strong> info@inspecciono.io</p>
                            <p><strong>Teléfono:</strong> 611962053</p>
                            <p><strong>Sitio Web:</strong> https://inspecciono.io</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Introducción */}
                        <section>
                            <h2 className="text-sm font-medium text-gray-700 mb-3">1. Introducción</h2>
                            <p className="text-sm text-gray-700 leading-relaxed mb-3">
                                Esta Política de Privacidad describe las políticas de <strong>Inspecciono</strong> sobre la recopilación, 
                                uso y divulgación de su información que recopilamos cuando utiliza nuestro sitio web 
                                (https://inspecciono.io) y nuestros servicios (el "Servicio").
                            </p>
                            <p className="text-sm text-gray-700 leading-relaxed">
                                Al acceder o utilizar el Servicio, usted consiente la recopilación, uso y divulgación de su 
                                información de acuerdo con esta Política de Privacidad. Si no consiente lo mismo, 
                                por favor no acceda ni utilice el Servicio.
                            </p>
                        </section>

                        {/* Modificaciones */}
                        <section>
                            <h2 className="text-sm font-medium text-gray-700 mb-3">2. Modificaciones de la Política</h2>
                            <p className="text-sm text-gray-700 leading-relaxed">
                                Podemos modificar esta Política de Privacidad en cualquier momento sin previo aviso y 
                                publicaremos la Política de Privacidad revisada en el Servicio. La Política revisada 
                                será efectiva 180 días después de que se publique en el Servicio y su acceso o uso 
                                continuado del Servicio después de ese tiempo constituirá su aceptación de la Política 
                                de Privacidad revisada. Por lo tanto, recomendamos que revise esta página periódicamente.
                            </p>
                        </section>

                        {/* Información que recopilamos */}
                        <section>
                            <h2 className="text-sm font-medium text-gray-700 mb-3">3. Información que Recopilamos</h2>
                            <p className="text-sm text-gray-700 leading-relaxed mb-3">
                                Recopilaremos y procesaremos la siguiente información personal sobre usted:
                            </p>
                            
                            <h3 className="text-xs font-medium text-gray-600 mb-2">3.1 Información Personal</h3>
                            <ul className="list-disc pl-5 mb-3 text-sm text-gray-700 space-y-1">
                                <li>Nombre completo</li>
                                <li>Dirección de correo electrónico</li>
                                <li>Número de teléfono móvil</li>
                                <li>Fecha de nacimiento</li>
                                <li>Dirección de residencia</li>
                        </ul>

                            <h3 className="text-xs font-medium text-gray-600 mb-2">3.2 Información Profesional</h3>
                            <ul className="list-disc pl-5 mb-3 text-sm text-gray-700 space-y-1">
                                <li>Dirección de trabajo</li>
                                <li>Información de pago</li>
                                <li>Perfil de redes sociales</li>
                                <li>Experiencia profesional</li>
                                <li>Especialidades</li>
                        </ul>
                        </section>

                        {/* Cómo recopilamos la información */}
                        <section>
                            <h2 className="text-sm font-medium text-gray-700 mb-3">4. Cómo Recopilamos su Información</h2>
                            <p className="text-sm text-gray-700 leading-relaxed mb-3">
                                Recopilamos su información personal a través de los siguientes métodos:
                            </p>
                            <ul className="list-disc pl-5 mb-3 text-sm text-gray-700 space-y-1">
                                <li>Cuando completa formularios de registro o envía información personal</li>
                                <li>Cuando interactúa con nuestro sitio web y servicios</li>
                                <li>De fuentes públicas disponibles y verificables</li>
                                <li>A través de cookies y tecnologías similares</li>
                        </ul>
                        </section>

                        {/* Cómo usamos la información */}
                        <section>
                            <h2 className="text-sm font-medium text-gray-700 mb-3">5. Cómo Utilizamos su Información</h2>
                            <p className="text-sm text-gray-700 leading-relaxed mb-3">
                                Utilizamos su información personal para los siguientes propósitos:
                            </p>
                            
                            <h3 className="text-xs font-medium text-gray-600 mb-2">5.1 Servicios Principales</h3>
                            <ul className="list-disc pl-5 mb-3 text-sm text-gray-700 space-y-1">
                                <li>Crear y gestionar su cuenta de usuario</li>
                                <li>Procesar pagos y transacciones</li>
                                <li>Proporcionar soporte al cliente</li>
                                <li>Gestionar pedidos y servicios</li>
                                <li>Resolver disputas</li>
                        </ul>

                            <h3 className="text-xs font-medium text-gray-600 mb-2">5.2 Mejoras y Comunicación</h3>
                            <ul className="list-disc pl-5 mb-3 text-sm text-gray-700 space-y-1">
                                <li>Recopilar testimonios y feedback</li>
                                <li>Marketing y promociones (con consentimiento)</li>
                                <li>Protección del sitio y usuarios</li>
                                <li>Comentarios entre usuarios</li>
                                <li>Cumplir términos y condiciones</li>
                            </ul>
                        </section>

                        {/* Notificaciones WhatsApp */}
                        <section>
                            <h2 className="text-sm font-medium text-gray-700 mb-3">6. Notificaciones WhatsApp</h2>
                            <p className="text-sm text-gray-700 leading-relaxed mb-3">
                                Si elige recibir notificaciones vía WhatsApp, recopilamos y utilizamos su número de teléfono 
                                únicamente para enviar alertas transaccionales relacionadas con productos que ha solicitado 
                                activamente a través de nuestro servicio.
                            </p>
                            <p className="text-sm text-gray-700 leading-relaxed mb-3">
                                <strong>Características importantes:</strong>
                            </p>
                            <ul className="list-disc pl-5 mb-3 text-sm text-gray-700 space-y-1">
                                <li>Los mensajes se envían solo con su consentimiento explícito</li>
                                <li>No enviamos mensajes promocionales o publicitarios</li>
                                <li>Utilizamos la API oficial de WhatsApp Business</li>
                                <li>Puede darse de baja en cualquier momento</li>
                                <li>Almacenamos un registro del consentimiento otorgado</li>
                            </ul>
                        </section>

                        {/* Compartir información */}
                        <section>
                            <h2 className="text-sm font-medium text-gray-700 mb-3">7. Compartir su Información</h2>
                            <p className="text-sm text-gray-700 leading-relaxed mb-3">
                                No transferiremos su información personal a terceros sin buscar su consentimiento, 
                                excepto en circunstancias limitadas como se describe a continuación:
                            </p>
                            
                            <h3 className="text-xs font-medium text-gray-600 mb-2">7.1 Servicios de Terceros</h3>
                            <ul className="list-disc pl-5 mb-3 text-sm text-gray-700 space-y-1">
                                <li>Servicios de publicidad</li>
                                <li>Análisis y métricas</li>
                                <li>Servicios de recuperación de pagos</li>
                                <li>Procesamiento de datos</li>
                            </ul>

                            <h3 className="text-xs font-medium text-gray-600 mb-2">7.2 Cumplimiento Legal</h3>
                            <ul className="list-disc pl-5 mb-3 text-sm text-gray-700 space-y-1">
                                <li>Cumplir con leyes aplicables</li>
                                <li>Hacer cumplir acuerdos</li>
                                <li>Responder a reclamaciones</li>
                                <li>Fusiones o adquisiciones</li>
                            </ul>
                        </section>

                        {/* Retención de datos */}
                        <section>
                            <h2 className="text-sm font-medium text-gray-700 mb-3">8. Retención de su Información</h2>
                            <p className="text-sm text-gray-700 leading-relaxed">
                                Conservaremos su información personal durante 90 días a 2 años después de que los usuarios 
                                terminen sus cuentas, o durante el tiempo que necesitemos para cumplir los propósitos para 
                                los cuales fue recopilada. Podemos necesitar conservar cierta información por períodos más 
                                largos para el mantenimiento de registros, reportes según la ley aplicable, o por otras 
                                razones legítimas como la aplicación de derechos legales y prevención de fraudes.
                            </p>
                        </section>

                        {/* Sus derechos */}
                        <section>
                            <h2 className="text-sm font-medium text-gray-700 mb-3">9. Sus Derechos</h2>
                            <p className="text-sm text-gray-700 leading-relaxed mb-3">
                                Dependiendo de la ley que aplique, puede tener derecho a acceder, rectificar o eliminar 
                                sus datos personales, recibir una copia de sus datos, restringir u oponerse al procesamiento 
                                activo de sus datos, y otros derechos relevantes según las leyes aplicables.
                            </p>
                            <p className="text-sm text-gray-700 leading-relaxed">
                                <strong>Para ejercer sus derechos:</strong> Puede escribirnos a <strong>info@inspecciono.io</strong>. 
                                Responderemos a su solicitud de acuerdo con la ley aplicable.
                            </p>
                        </section>

                        {/* Seguridad */}
                        <section>
                            <h2 className="text-sm font-medium text-gray-700 mb-3">10. Seguridad</h2>
                            <p className="text-sm text-gray-700 leading-relaxed">
                                La seguridad de su información es importante para nosotros y utilizaremos medidas de 
                                seguridad razonables para prevenir la pérdida, mal uso o alteración no autorizada de 
                                su información bajo nuestro control. Sin embargo, dados los riesgos inherentes, no 
                                podemos garantizar una seguridad absoluta.
                            </p>
                        </section>

                        {/* Contacto */}
                        <section>
                            <h2 className="text-sm font-medium text-gray-700 mb-3">11. Contacto y Oficial de Protección de Datos</h2>
                            <p className="text-sm text-gray-700 leading-relaxed mb-3">
                                Si tiene alguna consulta o preocupación sobre el procesamiento de su información, 
                                puede contactar a nuestro Oficial de Protección de Datos:
                            </p>
                            <div className="text-xs text-gray-700 space-y-1">
                                <p><strong>Email:</strong> info@inspecciono.io</p>
                                <p><strong>Dirección:</strong> C/Pedro I de Aragón, 14, Soria 50003, España</p>
                                <p>Abordaremos sus preocupaciones de acuerdo con la ley aplicable.</p>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}