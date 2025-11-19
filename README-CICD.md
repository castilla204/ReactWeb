# CI/CD Setup - React Web

## Resumen de Mejoras Implementadas

Este documento describe las mejoras de CI/CD implementadas siguiendo las mejores prácticas de 2025.

## 🚀 Mejoras Principales

### 1. GitHub Actions Workflows Mejorados

#### Pipeline CI/CD Completo (`ci-cd.yml`)
- ✅ Separación clara entre CI y CD
- ✅ Multi-stage builds con cache
- ✅ Security scanning con Trivy
- ✅ Deploy automático a Kubernetes
- ✅ Verificación post-despliegue

#### ArgoCD Sync (`argocd-sync.yml`)
- ✅ Sincronización automática con ArgoCD
- ✅ Fallback a kubectl directo

### 2. Configuraciones de Kubernetes Mejoradas

#### Deployment
- ✅ Security contexts (non-root, read-only filesystem)
- ✅ Resource limits y requests
- ✅ Health checks (liveness y readiness probes)
- ✅ Rolling update strategy optimizada

#### Horizontal Pod Autoscaler (HPA)
- ✅ Escalado basado en CPU y memoria
- ✅ Políticas de escalado configuradas
- ✅ Ventanas de estabilización

#### Pod Disruption Budget (PDB)
- ✅ Alta disponibilidad garantizada
- ✅ Mínimo de pods disponibles durante actualizaciones

### 3. Mejoras de Seguridad

- ✅ Security contexts en todos los pods
- ✅ Drop de capabilities innecesarias
- ✅ Read-only root filesystem donde es posible
- ✅ Escaneo automático de vulnerabilidades

### 4. GitOps con ArgoCD

- ✅ Application manifest para gestión declarativa
- ✅ Auto-sync y self-healing
- ✅ Prune automático de recursos obsoletos

## 📋 Configuración Requerida

### Secrets de GitHub

1. Ve a Settings > Secrets and variables > Actions
2. Añade los siguientes secrets:

```
DOCKER_USERNAME=tu_usuario_docker
DOCKER_PASSWORD=tu_password_docker
KUBECONFIG=<base64_encoded_kubeconfig>
ARGOCD_SERVER=https://argocd.inspecciono.com (opcional)
ARGOCD_TOKEN=tu_token_argocd (opcional)
```

### Generar KUBECONFIG

```bash
# En tu servidor k3s
cat ~/.kube/config | base64 -w 0
```

## 🔄 Flujo de Trabajo

1. **Desarrollo**: Push a `develop` → CI se ejecuta
2. **Merge a main**: Push a `main` → CI + CD se ejecutan
3. **Build**: Imagen Docker se construye y se sube a Docker Hub
4. **Deploy**: Kubernetes deployment se actualiza automáticamente
5. **Verificación**: Health checks verifican que el despliegue fue exitoso

## 📊 Monitoreo

- GitHub Actions muestra el estado de cada workflow
- ArgoCD muestra el estado de sincronización
- Kubernetes muestra el estado de los pods

## 🔧 Troubleshooting

### El workflow falla en el deploy

1. Verifica que `KUBECONFIG` esté correctamente configurado
2. Verifica que el cluster sea accesible desde GitHub Actions
3. Revisa los logs del workflow en GitHub

### ArgoCD no sincroniza

1. Verifica que el Application manifest esté aplicado
2. Verifica los permisos de ArgoCD
3. Revisa los logs de ArgoCD: `kubectl logs -n argocd -l app.kubernetes.io/name=argocd-application-controller`

## 📚 Referencias

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)

