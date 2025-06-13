from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.core.exceptions import PermissionDenied, ValidationError
from .models import Dispute
from .serializers import DisputeSerializer, DisputeCreateSerializer, DisputeResolveSerializer
from items.models import Item
from users.models import User
from .ai_service import analyze_dispute
from bookings.models import Booking
from condition_reports.models import ItemConditionReport
from django.utils import timezone

class DisputeListView(generics.ListAPIView):
    serializer_class = DisputeSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Dispute.objects.all()
        elif user.userType == 'owner':
            return Dispute.objects.filter(rental__product__owner=user)
        else:
            return Dispute.objects.filter(rental__rentee=user)

class DisputeDetailView(generics.RetrieveAPIView):
    serializer_class = DisputeSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Dispute.objects.all()
        elif user.userType == 'owner':
            return Dispute.objects.filter(rental__product__owner=user)
        else:
            return Dispute.objects.filter(rental__rentee=user)

class CreateDisputeView(generics.CreateAPIView):
    serializer_class = DisputeCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):

        booking_id = self.kwargs.get('booking_id')
        item_id = self.kwargs.get('item_id')

        rental = get_object_or_404(Item, id=item_id)
        booking = get_object_or_404(Booking, id=booking_id)
        print(rental.rentee_id, booking.id)

        checkout_report = get_object_or_404(ItemConditionReport, booking=booking.id, report_type='checkout')
        return_report = get_object_or_404(ItemConditionReport, booking=booking.id, report_type='return')

        print(checkout_report.overall_condition, return_report.overall_condition)
        user = self.request.user
        if user.id != rental.rentee_id:
            raise PermissionDenied("You don't have permission to create a dispute for this rental.")

        if Dispute.objects.filter(rental=rental, checkout_report=checkout_report, return_report=return_report).exists():
            raise ValidationError("A dispute already exists for this booking.")

        
        dispute = serializer.save(
            rental=rental,
            filed_by=user,
            checkout_report=checkout_report.overall_condition,
            return_report=return_report.overall_condition,
            status='pending'
        )

        
        self.process_dispute_with_ai(dispute)

    
    def process_dispute_with_ai(self, dispute):
    
        result = analyze_dispute(dispute.checkout_report, dispute.return_report, dispute.description)

    
        dispute.ai_analysis = result.get('analysis', '')
        dispute.ai_outcome = result.get('outcome', 'none')
        dispute.ai_at_fault = result.get('at_fault', 'none')
        dispute.ai_confidence_score = result.get('confidence_score', 0.0)
    
    
        dispute.total_evidence_score = result.get('total_evidence_score', 0.0)
        dispute.context_difference = result.get('context_difference', 0.0)
    
    
        dispute.outcome = dispute.ai_outcome
        dispute.at_fault = dispute.ai_at_fault
    
    
        confidence_score = dispute.ai_confidence_score
        total_evidence = result.get('total_evidence_score', 0.0)
        outcome = dispute.ai_outcome
    
    
        if confidence_score >= 0.8 and outcome in ['valid', 'invalid']:
            dispute.status = 'resolved'
            dispute.resolution_method = 'auto_ai_high_confidence'
    
    
        elif confidence_score >= 0.6 and total_evidence > 0.5 and outcome == 'valid':
            dispute.status = 'resolved'
            dispute.resolution_method = 'auto_ai_strong_evidence'
    
    
        elif confidence_score >= 0.6 and total_evidence < 0.3 and outcome == 'invalid':
            dispute.status = 'resolved'
            dispute.resolution_method = 'auto_ai_weak_evidence'
    
    
        else:
            dispute.status = 'pending'
            dispute.resolution_method = 'manual_review_required'
        
        
            if confidence_score < 0.6:
                dispute.review_reason = 'low_confidence'
            elif 0.3 <= total_evidence <= 0.5:
                dispute.review_reason = 'moderate_evidence_ambiguous'
            else:
                dispute.review_reason = 'complex_case'
        dispute.save()
    
    
        print(f"Dispute {dispute.id}: {outcome} (confidence: {confidence_score:.2f}, "
          f"evidence: {total_evidence:.2f}) -> {dispute.status}")
    
        return result

class ResolveDisputeView(generics.UpdateAPIView):
    serializer_class = DisputeResolveSerializer
    permission_classes = [permissions.IsAdminUser]  
    
    def get_queryset(self):
        return Dispute.objects.all()
    
    def perform_update(self, serializer):
        dispute = serializer.instance
        
        
        dispute.admin_outcome = serializer.validated_data.get('outcome', dispute.ai_outcome)
        dispute.admin_at_fault = serializer.validated_data.get('at_fault', dispute.ai_at_fault)
        dispute.admin_reviewed = True
        dispute.admin_reviewed_by = self.request.user
        dispute.admin_reviewed_at = timezone.now()
        dispute.status = 'resolved'
        
        
        dispute.outcome = dispute.admin_outcome
        dispute.at_fault = dispute.admin_at_fault
        
        dispute.save()
        
        
        if dispute.admin_at_fault == 'renter':
            renter = dispute.rental.renter
            renter.increment_fault()
            renter.save()

class UserDisputesView(generics.ListAPIView):
    """View for users to see their own disputes"""
    serializer_class = DisputeSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        if user.userType == 'owner':
            return Dispute.objects.filter(rental__product__owner=user)
        else:
            return Dispute.objects.filter(rental__rentee=user)


class DisputeMetricsView(APIView):
    """View for calculating and displaying AI metrics"""
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request):
        from .metrics import DisputeMetricsCalculator
        
        # Get query parameters
        days_back = request.query_params.get('days_back')
        if days_back:
            try:
                days_back = int(days_back)
            except ValueError:
                days_back = None
        
        calculator = DisputeMetricsCalculator()
        metrics = calculator.calculate_comprehensive_metrics(days_back)
        
        return Response(metrics)

class ExportMetricsView(APIView):
    """View for exporting metrics report"""
    permission_classes = [permissions.IsAdminUser]
    
    def post(self, request):
        from .metrics import DisputeMetricsCalculator
        
        days_back = request.data.get('days_back')
        if days_back:
            try:
                days_back = int(days_back)
            except ValueError:
                days_back = None
        
        calculator = DisputeMetricsCalculator()
        filepath = calculator.export_metrics_report(days_back=days_back)
        
        return Response({
            'message': 'Metrics report exported successfully',
            'filepath': filepath
        })
