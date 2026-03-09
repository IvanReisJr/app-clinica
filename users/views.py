from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import CustomUser, RolePermission
from .serializers import CustomUserSerializer, RolePermissionSerializer

class CustomUserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

class RolePermissionViewSet(viewsets.ModelViewSet):
    queryset = RolePermission.objects.all()
    serializer_class = RolePermissionSerializer

    def get_queryset(self):
        role = self.request.query_params.get('role')
        if role:
            return self.queryset.filter(role=role)
        return self.queryset

    @action(detail=False, methods=['post'])
    def bulk_save(self, request):
        role = request.data.get('role')
        permissions = request.data.get('permissions', []) # Lista de {slug: str, is_granted: bool}

        if not role:
            return Response({"error": "Cargo (role) é obrigatório"}, status=status.HTTP_400_BAD_REQUEST)

        # Atualiza ou cria cada permissão
        for p in permissions:
            RolePermission.objects.update_or_create(
                role=role,
                permission_slug=p['slug'],
                defaults={'is_granted': p['is_granted']}
            )

        return Response({"message": "Permissões salvas com sucesso!"})

    @action(detail=False, methods=['get'])
    def matrix(self, request):
        # Retorna a lista COMPLETA de permissões possíveis para um cargo, 
        # mesmo as que ainda não estão no banco.
        role = request.query_params.get('role')
        if not role:
            return Response({"error": "Role is required"}, status=400)
            
        current = {p.permission_slug: p.is_granted for p in RolePermission.objects.filter(role=role)}
        
        matrix = []
        for slug, label in RolePermission.permissions:
            matrix.append({
                'slug': slug,
                'label': label,
                'is_granted': current.get(slug, False)
            })
            
        return Response(matrix)
