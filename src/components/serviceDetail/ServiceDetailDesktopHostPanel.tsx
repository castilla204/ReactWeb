import React from 'react';
import { SD_DESKTOP_PANEL_CLASS } from '../../constants/homepageTypography';
import { cn } from '../../lib/utils';
import type { Catalog } from '../../lib/inspectionCatalog';
import type { InspectionConfig } from '../../lib/inspectionTemplateConfig';
import type { ServiceReviewItem } from './ServiceDetailReviewsSection';
import { ServiceDetailExpertHostRow } from './ServiceDetailExpertHostRow';
import InspectionReportPreview from './InspectionReportPreview';
import {
    ServiceDetailDeliverablesGuide,
    type ServiceDeliverableType,
} from './ServiceDetailDeliverablesGuide';
import { ServiceDetailDesktopReviewsCard } from './ServiceDetailDesktopReviewsCard';

export interface ServiceDetailDesktopHostPanelProps {
    className?: string;
    expertName: string;
    expertPicture?: string;
    expertDescription: string;
    expertFormacion: string;
    completedSearches: number;
    onFormacionClick?: () => void;
    onAvatarClick: () => void;
    onChatClick: () => void;
    description?: string | null;
    showInspectionReport: boolean;
    inspectionCatalog: Catalog | null;
    inspectionConfig: InspectionConfig | null;
    inspectionExtraDeliverables: ServiceDeliverableType[];
    visibleDeliverableTypes: ServiceDeliverableType[];
    allDeliverablesForList: ServiceDeliverableType[];
    reviews: ServiceReviewItem[];
    averageRating: number;
    onShowAllReviews: () => void;
}

export function ServiceDetailDesktopHostPanel({
    className,
    expertName,
    expertPicture,
    expertDescription,
    expertFormacion,
    completedSearches,
    onFormacionClick,
    onAvatarClick,
    onChatClick,
    description,
    showInspectionReport,
    inspectionCatalog,
    inspectionConfig,
    inspectionExtraDeliverables,
    visibleDeliverableTypes,
    allDeliverablesForList,
    reviews,
    averageRating,
    onShowAllReviews,
}: ServiceDetailDesktopHostPanelProps) {
    const hasDeliverablesColumn = showInspectionReport || visibleDeliverableTypes.length > 0;
    const hasReviewsColumn = reviews.length > 0;
    const hasSideBySideRow = hasDeliverablesColumn || hasReviewsColumn;
    const trimmedDescription = description?.trim() ?? '';

    return (
        <article className={cn(`${SD_DESKTOP_PANEL_CLASS} pt-2 lg:pt-2`, className)}>
            <div className="border-b border-line pb-4">
                <ServiceDetailExpertHostRow
                    variant="desktop"
                    expertName={expertName}
                    expertPicture={expertPicture}
                    expertDescription={expertDescription}
                    expertFormacion={expertFormacion}
                    completedSearches={completedSearches}
                    className="min-h-[84px] border-b-0 py-2"
                    onFormacionClick={onFormacionClick}
                    onAvatarClick={onAvatarClick}
                    onChatClick={onChatClick}
                />
            </div>

            <div className="mt-5 flex flex-col gap-5">
                {trimmedDescription ? (
                    <section className="min-w-0 overflow-hidden">
                        <h2 className="hp-section-title mb-2">Acerca del servicio</h2>
                        <div className="sd-body sd-user-text space-y-3">
                            {trimmedDescription
                                .split(/\n\s*\n/)
                                .map((paragraph) => paragraph.trim())
                                .filter(Boolean)
                                .map((paragraph, index) => (
                                    <p key={index} className="m-0 whitespace-pre-line">
                                        {paragraph}
                                    </p>
                                ))}
                        </div>
                    </section>
                ) : null}

                {hasSideBySideRow ? (
                    <div
                        className={cn(
                            'grid grid-cols-1 gap-x-7 gap-y-5 lg:items-stretch',
                            hasDeliverablesColumn &&
                                hasReviewsColumn &&
                                'lg:grid-cols-[minmax(0,1fr)_auto]',
                            trimmedDescription && 'border-t border-line pt-5',
                        )}
                    >
                        {hasDeliverablesColumn ? (
                            showInspectionReport ? (
                                <section className="flex min-h-0 min-w-0 flex-col">
                                    <h2 className="hp-section-title mb-3 shrink-0">Qué entregará</h2>
                                    <div className="flex min-h-0 flex-1 flex-col">
                                        <InspectionReportPreview
                                            catalog={inspectionCatalog!}
                                            config={inspectionConfig}
                                        />
                                        {inspectionExtraDeliverables.length > 0 ? (
                                            <div className="mt-3">
                                                <ServiceDetailDeliverablesGuide
                                                    items={inspectionExtraDeliverables}
                                                    variant="inline"
                                                    presentation="cover"
                                                    showHeading={false}
                                                />
                                            </div>
                                        ) : null}
                                    </div>
                                </section>
                            ) : (
                                <section className="min-w-0">
                                    <ServiceDetailDeliverablesGuide
                                        items={allDeliverablesForList}
                                        variant="inline"
                                        presentation="list"
                                        showHeading
                                        showUnselected
                                    />
                                </section>
                            )
                        ) : null}

                        {hasReviewsColumn ? (
                            <section
                                id="sd-reviews-desktop"
                                className="flex min-h-0 w-full flex-col lg:w-[15.5rem] lg:max-w-full lg:justify-self-end lg:self-stretch"
                                aria-labelledby="sd-reviews-desktop-heading"
                            >
                                <h2
                                    id="sd-reviews-desktop-heading"
                                    className="hp-section-title mb-3 shrink-0"
                                >
                                    Reseñas
                                </h2>
                                <ServiceDetailDesktopReviewsCard
                                    reviews={reviews}
                                    averageRating={averageRating}
                                    onShowAll={onShowAllReviews}
                                    className="min-h-0 flex-1"
                                />
                            </section>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </article>
    );
}
