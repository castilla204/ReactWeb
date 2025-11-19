# GitHub Actions Workflows

Este directorio contiene los workflows de CI/CD para el proyecto.

## Workflows Disponibles

### 1. `ci-cd.yml` - Pipeline Principal

Pipeline completo de CI/CD que incluye:

- **CI (Continuous Integration)**:
  - Checkout del código
  - Setup de Node.js con cache
  - Instalación de dependencias
  - Linting
  - Tests (si están disponibles)
  - Build de la aplicación
  - Upload de artifacts

- **CD (Continuous Deployment)**:
  - Build y push de imagen Docker
  - Deploy a Kubernetes
  - Verificación del despliegue

- **Security Scanning**:
  - Escaneo de vulnerabilidades con Trivy
  - Upload de resultados a GitHub Security

### 2. `argocd-sync.yml` - Sincronización con ArgoCD

Workflow para sincronizar manualmente o automáticamente con ArgoCD cuando cambian los manifiestos de Kubernetes.

## Secrets Requeridos

Configura los siguientes secrets en GitHub:

- `DOCKER_USERNAME`: Usuario de Docker Hub
- `DOCKER_PASSWORD`: Contraseña de Docker Hub
- `KUBECONFIG`: Configuración de Kubernetes codificada en base64
- `ARGOCD_SERVER`: URL del servidor ArgoCD (opcional)
- `ARGOCD_TOKEN`: Token de autenticación de ArgoCD (opcional)

## Triggers

- **Push a main/develop**: Ejecuta CI y CD completo
- **Pull Request**: Solo ejecuta CI
- **Manual (workflow_dispatch)**: Permite ejecución manual

## Mejores Prácticas Implementadas

1. **Multi-stage builds**: Separación de CI y CD
2. **Docker layer caching**: Optimización de builds
3. **Semantic versioning**: Tags automáticos basados en commits
4. **Security scanning**: Escaneo automático de vulnerabilidades
5. **Rolling updates**: Despliegues sin downtime
6. **Health checks**: Verificación post-despliegue

