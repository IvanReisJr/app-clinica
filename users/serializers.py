from rest_framework import serializers
from .models import CustomUser, RolePermission

class CustomUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    permissions = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role', 'crm', 'full_name', 'is_active', 'password', 'permissions']

    def get_permissions(self, obj):
        # Retorna apenas a lista de 'slugs' que estão com is_granted=True para este cargo
        return list(RolePermission.objects.filter(role=obj.role, is_granted=True).values_list('permission_slug', flat=True))

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        return super().update(instance, validated_data)

class RolePermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RolePermission
        fields = ['role', 'permission_slug', 'is_granted']
