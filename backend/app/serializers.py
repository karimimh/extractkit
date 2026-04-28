from rest_framework import serializers


class PreviewRequestSerializer(serializers.Serializer):
    url = serializers.URLField(required=True)


class ExportRequestSerializer(serializers.Serializer):
    url = serializers.URLField(required=True)
    selectors = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list,
        allow_empty=True,
    )
    mode = serializers.ChoiceField(
        choices=["include", "exclude"],
        required=False,
        default="exclude",
    )

    def validate(self, attrs):
        mode = attrs.get("mode", "exclude")
        selectors = attrs.get("selectors") or []

        if mode == "include" and not selectors:
            raise serializers.ValidationError(
                "At least one selector is required for include mode."
            )

        return attrs
